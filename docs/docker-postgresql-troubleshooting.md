# Docker PostgreSQL 연결 불안정 문제 해결

> 작성일: 2026-05-11

## 1. 문제 현상

`pnpm nx serve server` 실행 시 Prisma에서 `ECONNREFUSED` 에러가 반복 발생.

```
PrismaClientKnownRequestError:
Invalid `this.prisma.admin.findFirst()` invocation:
  code: 'ECONNREFUSED'
```

## 2. 환경 정보

| 항목 | 내용 |
|------|------|
| OS | Windows + WSL2 (Ubuntu 24.04) |
| Docker | WSL2 내 직접 설치 (Docker Desktop 미사용) |
| DB | `postgres:18-alpine` |
| ORM | Prisma + `@prisma/adapter-pg` (PrismaPg) |
| Framework | NestJS |

## 3. 원인 분석

### 3-1. 직접적 원인: Docker 데몬 반복 재시작

PostgreSQL 컨테이너가 **약 30초마다 종료 후 재시작**되고 있었음.

```
docker logs demo-db:
  LOG: received fast shutdown request    ← 외부에서 SIGTERM 수신
  LOG: checkpoint starting: shutdown immediate
  LOG: database system is shut down
```

`docker events` 및 `journalctl -u docker` 분석 결과:

```
16:17:05 — stopping restart-manager (container=demo-db)
16:17:06 — Stopped docker.service         ← Docker 데몬 자체가 종료
16:17:08 — Starting docker.service        ← Docker 데몬 재시작
```

**Docker 데몬이 30초마다 재시작** → 모든 컨테이너 강제 종료 → PostgreSQL에 SIGTERM 전달 → `fast shutdown`

### 3-2. 근본 원인: WSL2 VM 자동 종료

WSL2는 유휴 상태 시 VM을 자동 종료하는 `vmIdleTimeout` 설정이 있음. 이로 인해:

1. WSL2 VM이 유휴 상태로 판단됨
2. VM 종료 → Docker 데몬 종료 → 컨테이너 종료
3. WSL2 재시작 → Docker 재시작 → 컨테이너 재시작 (restart 정책에 의해)
4. 이 사이클이 반복되며 앱에서 DB 연결 실패

### 3-3. 추가 악화 요인

- **`live-restore: false`** (기본값): Docker 데몬 재시작 시 컨테이너도 함께 죽음
- **`@prisma/adapter-pg`의 `$connect()` 특성**: 실제 DB 연결을 테스트하지 않아 연결 실패를 조기 감지 불가
- **`ng-openapi-gen`**: API 클라이언트 생성 시 디렉토리 삭제 에러로 서버 크래시 유발

## 4. 해결 방법

### 4-1. WSL2 자동 종료 방지 (핵심)

`C:\Users\{사용자명}\.wslconfig` 파일 생성:

```ini
[wsl2]
vmIdleTimeout=-1
```

적용 후 WSL 재시작:

```powershell
wsl --shutdown
```

### 4-2. Docker live-restore 활성화 (권장)

Docker 데몬이 재시작되더라도 컨테이너를 유지하도록 설정.

WSL 내에서 `/etc/docker/daemon.json` 생성:

```json
{
  "live-restore": true
}
```

적용:

```bash
sudo systemctl restart docker
docker info | grep "Live Restore"  # Live Restore Enabled: true 확인
```

### 4-3. docker-compose.yml 개선

```yaml
services:
  database:
    image: postgres:18-alpine
    container_name: demo-db
    restart: unless-stopped
    shm_size: 128mb
    stop_grace_period: 30s
    environment:
      POSTGRES_USER: demouser
      POSTGRES_PASSWORD: qwerasdf1234
      POSTGRES_DB: demodb
      TZ: Asia/Seoul
      PGDATA: /data/pgdata
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demouser -d demodb"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
    volumes:
      - demo_database_volume:/data
    ports:
      - "5432:5432"
```

주요 변경사항:
- `healthcheck` — DB 준비 상태 확인
- `shm_size: 128mb` — 공유 메모리 부족에 의한 크래시 방지
- `stop_grace_period: 30s` — 정상 종료 시 충분한 시간 확보
- `restart: unless-stopped` — 수동 중지 시 자동 재시작 방지

### 4-4. PrismaService 연결 재시도 로직

`@prisma/adapter-pg`를 사용할 때 `$connect()`는 실제 연결을 테스트하지 않으므로, `SELECT 1` 쿼리로 연결 상태를 확인하는 재시도 로직 추가:

```typescript
// apps/server/src/prisma/prisma.service.ts
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    super({ adapter })
  }

  async onModuleInit() {
    const maxRetries = 10;
    const retryDelay = 2000; // 2초

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$queryRawUnsafe('SELECT 1');
        this.logger.log('데이터베이스 연결 성공');
        return;
      } catch (error) {
        if (attempt === maxRetries) {
          this.logger.error(
            `데이터베이스 연결 실패 (${maxRetries}회 시도 후 포기). DB가 준비되면 자동 연결됩니다.`
          );
          return; // 서버는 계속 실행
        }
        this.logger.warn(`데이터베이스 연결 대기 중... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
}
```

### 4-5. API 클라이언트 생성 에러 방어 (main.ts)

`ng-openapi-gen`의 내부 디렉토리 삭제 에러가 서버를 크래시시키지 않도록 `.catch()` 추가:

```typescript
generateApiClient(document).then(() => {
  Logger.log('API Client Generated');
}).catch((err) => {
  Logger.warn('API Client 생성 실패 (서버는 계속 실행됩니다): ' + err.message);
});
```

## 5. 디버깅 체크리스트

향후 같은 문제 발생 시 확인 순서:

```bash
# 1. 컨테이너 상태 확인 (Up 시간이 짧으면 재시작 의심)
docker ps

# 2. PostgreSQL 로그에서 shutdown 확인
docker logs demo-db 2>&1 | grep "shutdown"

# 3. Docker 데몬 재시작 여부 확인
journalctl -u docker --since "5 min ago" | grep -E "Started|Stopped"

# 4. Docker 이벤트에서 컨테이너 lifecycle 확인
docker events --filter container=demo-db --since 5m --until 0s

# 5. live-restore 설정 확인
docker info | grep "Live Restore"

# 6. 포트 포워딩 확인 (Windows에서)
netstat -ano | findstr ":5432"
```

## 6. 주의사항

- `.wslconfig`는 **Windows 측 파일**이므로 `C:\Users\{사용자명}\` 에 위치해야 함
- `/etc/docker/daemon.json`은 **WSL 내부 파일**이므로 WSL 재시작 시 유실될 수 있음 → WSL 부팅 스크립트에 복사 로직 추가 권장
- `postgres:18`은 베타 버전이므로 프로덕션에서는 `postgres:17` 사용 권장
