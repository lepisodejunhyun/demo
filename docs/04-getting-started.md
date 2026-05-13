# 처음부터 끝까지 — 프로젝트 실행/관리 가이드

이 문서는 **이 프로젝트를 처음 받은 사람**이 컴퓨터에 세팅하고 실행하기까지 필요한 모든 단계를 안내합니다. 개발이 처음이라도 따라할 수 있도록 명령어 한 줄 한 줄 설명합니다.

> 운영체제는 Windows 기준이지만, Mac/Linux도 명령은 거의 같아요.

---

## 0. 큰 그림 — 우리가 켜야 할 것들

이 프로젝트가 정상 동작하려면 **3개의 프로그램이 동시에 떠 있어야** 합니다:

```
┌─────────────────────┐
│ 1. PostgreSQL DB    │  ← Docker로 실행 (포트 5432)
└─────────────────────┘
            ▲
            │
┌─────────────────────┐
│ 2. NestJS 서버      │  ← node로 실행 (포트 3000)
└─────────────────────┘
            ▲
            │
┌─────────────────────┐
│ 3. Angular admin    │  ← node로 실행 (포트 4200)
└─────────────────────┘
            ▲
            │
        [브라우저]
```

각각 별도 터미널 창이 필요합니다 (총 3개).

---

## 1. 사전 준비 — 도구 설치

처음 한 번만 하면 됩니다.

### 1-1. Node.js 설치

- **무엇**: 자바스크립트를 컴퓨터에서 실행하는 도구.
- **버전**: 20 LTS 이상 권장 (이 프로젝트는 `@types/node: 20.x` 사용).
- **다운로드**: https://nodejs.org/ (LTS 버전 선택)
- **확인**: 터미널에서
  ```bash
  node -v
  ```
  → `v20.x.x` 같이 나오면 OK.

### 1-2. pnpm 설치

- **무엇**: npm/yarn 같은 패키지 매니저인데 더 빠르고 디스크 절약.
- **이 프로젝트가 쓰는 이유**: `pnpm-lock.yaml` 파일이 있음 → pnpm이 표준.
- **설치 명령**:
  ```bash
  npm install -g pnpm
  ```
- **확인**:
  ```bash
  pnpm -v
  ```

### 1-3. Docker Desktop 설치

- **무엇**: 컨테이너(=격리된 미니 가상 컴퓨터) 도구. 우리는 PostgreSQL DB 컨테이너만 실행.
- **다운로드**: https://www.docker.com/products/docker-desktop/
- **Windows의 경우**: WSL2를 활성화하라고 안내가 나옴. 그대로 따라 설치.
- **확인**:
  ```bash
  docker -v
  docker-compose -v
  ```

> Docker Desktop이 실행 중이어야 docker 명령이 작동합니다. 시작 메뉴에서 Docker Desktop을 실행해두세요.

### 1-4. 코드 에디터 (VSCode 권장)

- **다운로드**: https://code.visualstudio.com/
- **추천 확장 프로그램**:
  - **Prisma**: `.prisma` 파일 문법 강조
  - **Angular Language Service**: Angular 자동완성
  - **ESLint**: 코드 스타일 검사
  - **Tailwind CSS IntelliSense**: Tailwind 클래스 자동완성
  - **Material Icon Theme**: 폴더/파일 아이콘 보기 좋게

### 1-5. Git (선택)

코드 버전 관리. 이미 설치된 경우 많음.
- **확인**: `git --version`
- **설치**: https://git-scm.com/

---

## 2. 프로젝트 코드 받기

### 2-1. 코드 위치 확인

이 프로젝트는 `c:\Users\jun63\Desktop\demo\` 폴더에 있다고 가정합니다.

다른 곳에서 새로 받으려면:
```bash
git clone <저장소-URL> demo
cd demo
```

### 2-2. 폴더 구조 확인

프로젝트 폴더에 들어가 보면 큰 구조는:

```
demo/
├── apps/              ← 앱 코드 (server, admin 등)
├── libs/              ← 공유 라이브러리
├── prisma/            ← DB 스키마
├── docker/            ← Docker 설정
├── docs/              ← 학습 문서 (이 파일)
├── package.json       ← 의존성 목록
├── pnpm-lock.yaml     ← 의존성 정확한 버전 기록
├── nx.json            ← Nx 설정
└── prisma.config.ts   ← Prisma 설정
```

---

## 3. 의존성 설치

프로젝트가 사용하는 모든 라이브러리(NestJS, Angular, Prisma 등)를 한 번에 다운로드.

### 명령

프로젝트 폴더 안에서:
```bash
pnpm install
```

### 무슨 일이 일어나는가?

1. `package.json`을 읽어서 필요한 라이브러리 목록 파악.
2. `pnpm-lock.yaml`에 기록된 정확한 버전을 다운로드.
3. `node_modules/` 폴더에 모두 저장 (수백~수천 개 파일).

### 시간

처음엔 2~5분 정도 걸려요. 이후엔 캐시 덕분에 빠름.

### 결과 확인

- `node_modules/` 폴더가 생겼는지 확인.
- 그 안에 `@nestjs`, `@angular`, `@prisma` 같은 폴더들이 있어야 함.

### 흔한 오류

| 증상 | 해결 |
| --- | --- |
| `pnpm: command not found` | pnpm 설치 안 됨. 1-2단계 다시 확인. |
| 권한 에러 | 관리자 권한으로 터미널 실행 (Windows 우클릭 → 관리자 권한). |
| 매우 느림 | 회사 네트워크에서 막혔을 수 있음. 사내 npm 미러나 VPN 확인. |

---

## 4. 환경 변수 설정

### 환경 변수란?

코드 안에 비밀번호/DB 주소 같은 정보를 직접 적지 않고, 외부 파일(`.env`)에서 읽는 방식.

장점:
- 비밀번호가 git에 안 올라감 (.env는 .gitignore에 포함).
- 개발/운영 환경마다 다른 값 사용 가능.

### .env 파일 만들기

프로젝트 루트(`demo/` 폴더)에 `.env` 파일을 새로 만듭니다 (확장자 없는 파일).

**내용**:
```
DATABASE_URL=postgresql://demouser:qwerasdf1234@localhost:5432/demodb
DEFAULT_ADMIN_USERNAME=admin@example.com
DEFAULT_ADMIN_PASSWORD=SecurePass1234!
PORT=3000
```

### 각 변수 풀이

**`DATABASE_URL`**
- DB 접속 정보를 한 줄에 표현.
- 형식: `postgresql://[유저]:[비번]@[호스트]:[포트]/[DB이름]`
- 위 값은 [docker/docker-compose.yml](../docker/docker-compose.yml)의 설정과 일치해야 함:
  - `POSTGRES_USER: demouser` ↔ `demouser`
  - `POSTGRES_PASSWORD: qwerasdf1234` ↔ `qwerasdf1234`
  - `POSTGRES_DB: demodb` ↔ `demodb`
  - 포트 `"5432:5432"` ↔ `localhost:5432`

**`DEFAULT_ADMIN_USERNAME`, `DEFAULT_ADMIN_PASSWORD`**
- 서버 첫 실행 시 자동 생성될 최고관리자 계정.
- [apps/server/src/app/admin/admin.module.ts](../apps/server/src/app/admin/admin.module.ts)에서 `process.env.DEFAULT_ADMIN_USERNAME`으로 읽어서 시딩.
- 운영 환경에서는 다른 값을 사용.

**`PORT`**
- NestJS 서버가 동작할 포트. 기본 3000.

### 주의

- `.env` 파일은 **절대 git에 올리지 마세요**. 이미 `.gitignore`에 추가되어 있을 거예요. 확인:
  ```bash
  git status
  ```
  → `.env`가 안 보여야 정상.

- 비밀번호는 운영 환경에서는 절대 위 예시 그대로 쓰지 마세요. 강한 비밀번호로 변경.

---

## 5. DB 띄우기

### 5-1. Docker 컨테이너 시작

```bash
docker-compose -f docker/docker-compose.yml up -d
```

### 각 부분 풀이

- `docker-compose`: docker-compose 명령
- `-f docker/docker-compose.yml`: 사용할 설정 파일 지정
- `up`: 컨테이너 시작
- `-d`: detached 모드 (백그라운드 실행). 안 붙이면 터미널이 점유됨.

### 무슨 일이 일어나는가?

1. Docker가 `postgres:18-alpine` 이미지를 다운로드 (처음 1회만, 약 50MB).
2. 컨테이너 생성 + 시작.
3. 컨테이너 안에서 PostgreSQL 서버가 실행.
4. 호스트의 5432 포트가 컨테이너의 5432 포트와 연결됨.

### 5-2. 동작 확인

```bash
docker-compose -f docker/docker-compose.yml ps
```

→ `demo-db` 상태가 `Up`이어야 정상.

또는 Docker Desktop GUI에서 Containers 탭 보면 `demo-db`가 보임.

### 5-3. 직접 접속해보기 (선택)

```bash
docker exec -it demo-db psql -U demouser -d demodb
```

→ psql 프롬프트가 뜸. `\dt`로 테이블 목록 확인. 처음엔 비어있음. `\q`로 종료.

### 5-4. 자주 쓰는 Docker 명령

| 명령 | 의미 |
| --- | --- |
| `docker-compose -f docker/docker-compose.yml up -d` | DB 시작 (백그라운드) |
| `docker-compose -f docker/docker-compose.yml down` | DB 중지 + 컨테이너 삭제 (볼륨은 유지) |
| `docker-compose -f docker/docker-compose.yml down -v` | DB 중지 + **데이터까지 모두 삭제** (초기화) |
| `docker-compose -f docker/docker-compose.yml ps` | 상태 확인 |
| `docker-compose -f docker/docker-compose.yml logs database` | 로그 보기 |
| `docker-compose -f docker/docker-compose.yml logs -f database` | 로그 실시간 보기 (Ctrl+C로 종료) |

### 흔한 오류

| 증상 | 해결 |
| --- | --- |
| `Cannot connect to the Docker daemon` | Docker Desktop 실행 안 됨. 시작 메뉴에서 Docker Desktop 실행. |
| `port is already allocated` | 다른 곳에서 5432 포트 사용 중. 기존 PostgreSQL을 중지하거나, docker-compose.yml의 포트를 5433 등으로 변경 후 `.env`도 같이 수정. |
| `permission denied` | Linux에서 docker 그룹에 사용자 추가 필요 (`sudo usermod -aG docker $USER` 후 재로그인). |

---

## 6. DB 스키마 적용 (Prisma Migrate)

DB는 켜졌지만 아직 테이블이 없어요. Prisma 마이그레이션으로 만들어줍시다.

### 6-1. Prisma 클라이언트 생성

```bash
pnpm prisma generate
```

### 무슨 일이 일어나는가?

1. `prisma/` 폴더의 모든 `.prisma` 파일을 읽음.
2. 그 정의에서 TypeScript 타입을 자동 생성.
3. 결과를 `node_modules/@prisma/client/`에 저장.

→ 이제 코드에서 `import { Admin } from '@prisma/client'` 같은 게 동작함.

### 6-2. 마이그레이션 적용

```bash
pnpm prisma migrate dev --name init
```

### 무슨 일이 일어나는가?

1. `prisma/` 폴더의 정의와 현재 DB 상태를 비교.
2. 차이를 SQL로 만듬 (CREATE TABLE 등).
3. DB에 그 SQL 실행.
4. `prisma/migrations/` 폴더에 SQL 파일 저장 (히스토리).
5. `--name init`: 이 마이그레이션의 이름. 첫 번째니 'init'으로.

### 6-3. 확인 — Prisma Studio

```bash
pnpm prisma studio
```

브라우저가 자동으로 열림 (`http://localhost:5555`). DB의 모든 테이블을 GUI로 볼 수 있어요.

→ Admin, Faq, Notice, Event 같은 테이블이 보이면 성공.

### 자주 쓰는 Prisma 명령

| 명령 | 의미 |
| --- | --- |
| `pnpm prisma generate` | .prisma 파일에서 타입 재생성 |
| `pnpm prisma migrate dev --name <설명>` | 변경사항을 DB에 반영 + 히스토리 저장 |
| `pnpm prisma migrate reset` | DB 완전 초기화 후 모든 마이그레이션 재실행 (**위험 - 데이터 사라짐**) |
| `pnpm prisma studio` | DB GUI |
| `pnpm prisma db push` | 마이그레이션 없이 강제 동기화 (개발 초기에만) |

### 흔한 오류

| 증상 | 해결 |
| --- | --- |
| `Error: P1001: Can't reach database server` | DB 컨테이너가 안 뜸. 5단계 확인. |
| `Authentication failed` | `.env`의 DATABASE_URL이 docker-compose.yml과 안 맞음. |
| `Migration failed: relation already exists` | 이미 테이블이 있는데 또 만들려 함. `prisma migrate reset`으로 초기화. |

---

## 7. NestJS 서버 실행

### 7-1. 명령

새 터미널 열고 (DB 띄운 터미널은 그대로 둠):
```bash
pnpm nx serve server
```

### 무슨 일이 일어나는가?

1. Nx가 `apps/server/` 폴더를 빌드.
2. TypeScript를 JavaScript로 변환.
3. 변환된 코드를 Node로 실행.
4. NestJS가 모든 모듈을 초기화 (OnModuleInit 훅 실행 — 최고관리자 시딩 등).
5. 자동 생성: API 클라이언트(`libs/api-client/`)가 생성됨.
6. 포트 3000에서 listen 시작.

### 7-2. 확인

터미널에 다음 메시지가 보이면 성공:
```
🚀 Application is running on: http://localhost:3000/api
```

브라우저에서:
- `http://localhost:3000/api` — 기본 메시지 (Hello API)
- `http://localhost:3000/reference` — API 문서 (Swagger UI)

→ /reference에서 모든 API 그룹(admin, faq, notice, event 등)이 보이면 성공.

### 7-3. 핫 리로드

서버 코드를 수정하면 자동으로 재시작됩니다. 별도 명령 필요 없음.

### 흔한 오류

| 증상 | 해결 |
| --- | --- |
| `Cannot find module '@prisma/client'` | `pnpm prisma generate` 안 했음. 6-1 단계 실행. |
| `Cannot find name 'process'` | `@types/node` 설치 안 됨. `pnpm install` 다시. |
| `EADDRINUSE :::3000` | 3000 포트 이미 사용 중. 기존 서버 종료하거나 .env의 PORT 변경. |
| 시작은 됐는데 API 호출 시 DB 에러 | DB 연결 실패. .env의 DATABASE_URL 확인. |

---

## 8. Angular admin 실행

### 8-1. 명령

또 새 터미널 열고:
```bash
pnpm nx serve admin
```

### 무슨 일이 일어나는가?

1. Nx가 `apps/admin/` 폴더를 빌드 (Angular 컴파일러 사용).
2. 개발 서버를 포트 4200에 시작.
3. 코드 수정 시 자동 핫 리로드.

### 8-2. 확인

브라우저가 자동으로 열림 (`http://localhost:4200`).
- 자동으로 로그인 페이지(`/sign-in`)로 리다이렉트.
- 로그인 폼이 보임.

### 8-3. 로그인

- 이메일: `.env`의 `DEFAULT_ADMIN_USERNAME` (예: admin@example.com)
- 비밀번호: `.env`의 `DEFAULT_ADMIN_PASSWORD` (예: SecurePass1234!)

성공하면 대시보드로 이동.

### 흔한 오류

| 증상 | 해결 |
| --- | --- |
| 로그인 시 CORS 에러 | 서버에 enableCors() 적용 안 됨. 서버 재시작. |
| `Cannot find module '@api-client'` | 서버가 안 떴거나 libs/api-client 자동 생성 안 됨. 서버 시작 확인. |
| 로그인 시 401 | .env의 비밀번호와 admin module 시딩 시 사용된 비밀번호가 다름. DB 초기화 후 재시도. |
| `Cannot find module '@angular/...'` | `pnpm install` 안 했음. |

---

## 9. 정상 작동 체크리스트

모든 게 잘 됐다면 다음이 모두 작동해야 합니다:

- [ ] 터미널 1: DB 컨테이너 `Up` 상태
- [ ] 터미널 2: 서버가 `http://localhost:3000`에서 동작 중
- [ ] 터미널 3: admin이 `http://localhost:4200`에서 동작 중
- [ ] 브라우저: `http://localhost:4200`에서 로그인 가능
- [ ] 브라우저: 로그인 후 대시보드로 이동
- [ ] 브라우저: 사이드바 메뉴 클릭 → 각 페이지 표시
- [ ] 브라우저: `http://localhost:3000/reference`에서 API 문서 확인

---

## 10. 자주 쓰는 명령 모음

### 10-1. 매일 쓰는 명령

```bash
# 1. DB 시작 (이미 떠 있으면 생략)
docker-compose -f docker/docker-compose.yml up -d

# 2. 서버 시작
pnpm nx serve server

# 3. admin 시작 (별도 터미널)
pnpm nx serve admin
```

### 10-2. 코드 수정 후

대부분 자동 핫 리로드라 추가 명령 불필요.

### 10-3. `.prisma` 파일 수정 후

```bash
pnpm prisma generate                    # 타입 재생성
pnpm prisma migrate dev --name <설명>   # DB에 반영
```

(서버는 자동 재시작됨)

### 10-4. 의존성 추가 시

```bash
# 일반 의존성
pnpm add <패키지명>

# 개발 의존성 (테스트 도구 등)
pnpm add -D <패키지명>
```

설치 후 서버/admin 재시작 필요.

### 10-5. 빌드 (배포용)

```bash
# 서버 빌드
pnpm nx build server

# admin 빌드
pnpm nx build admin

# 결과: dist/ 폴더에 생성됨
```

### 10-6. 종료

각 터미널에서 `Ctrl+C`. DB는 명시적으로 중지:
```bash
docker-compose -f docker/docker-compose.yml down
```

---

## 11. 디버깅 팁

### 11-1. 로그 어디서 보나?

| 무엇 | 어디서 |
| --- | --- |
| NestJS 서버 로그 | 서버 터미널 |
| Admin 빌드 로그 | admin 터미널 |
| DB 로그 | `docker-compose -f docker/docker-compose.yml logs database` |
| 브라우저 콘솔 로그 | 브라우저 개발자 도구 (F12) → Console |
| HTTP 요청/응답 | 브라우저 개발자 도구 → Network |

### 11-2. API 요청이 실패할 때

순서대로 확인:

1. **브라우저 Network 탭**:
   - 요청이 실제로 발사됐는지?
   - 상태 코드는? (200/400/401/500)
   - Response Body에 에러 메시지가 있는지?

2. **서버 터미널**:
   - 요청이 도달했는지?
   - 에러 스택 트레이스가 있는지?

3. **DB 직접 확인**:
   - `pnpm prisma studio`에서 데이터가 진짜 있는지?

### 11-3. 자주 발생하는 에러 패턴

**400 Bad Request — 검증 실패**
- 원인: ValidationPipe가 요청을 거부. DTO 규칙 안 맞음.
- 해결: Response Body의 message 확인. 어느 필드가 실패했는지 알려줌.

**401 Unauthorized — 인증 실패**
- 원인: 이메일/비밀번호 틀림.
- 해결: .env의 DEFAULT_ADMIN_USERNAME/PASSWORD 다시 확인.

**404 Not Found — URL 잘못됨**
- 원인: 라우트 등록 안 됨, AppModule에 모듈 import 안 됨.
- 해결: app.module.ts와 컨트롤러의 @Controller(...) 확인.

**500 Internal Server Error — 서버 내부 오류**
- 원인: 코드 예외, DB 에러 등.
- 해결: 서버 터미널의 스택 트레이스 확인.

**CORS 에러 (브라우저 콘솔)**
- 원인: 서버의 CORS 설정 안 됨.
- 해결: [apps/server/src/main.ts](../apps/server/src/main.ts)에 `app.enableCors()` 있는지 확인.

### 11-4. DB 데이터 직접 보기

**Prisma Studio (GUI)**:
```bash
pnpm prisma studio
```

**SQL 직접 실행**:
```bash
docker exec -it demo-db psql -U demouser -d demodb

# 안에서:
SELECT * FROM "Admin";
SELECT * FROM "Faq";
\q   # 종료
```

### 11-5. DB 초기화

테이블 구조가 꼬여서 처음부터 다시 하고 싶을 때:

```bash
# 1. 컨테이너 + 데이터 모두 삭제
docker-compose -f docker/docker-compose.yml down -v

# 2. 다시 시작
docker-compose -f docker/docker-compose.yml up -d

# 3. 마이그레이션 적용
pnpm prisma migrate dev --name init
```

> `down -v`의 `-v`가 핵심. 데이터 볼륨까지 같이 삭제.

---

## 12. 프로젝트 관리 시나리오

### 12-1. 다른 컴퓨터에서 처음 받아 실행할 때

```bash
git clone <저장소> demo
cd demo
pnpm install                                          # 1. 의존성 설치
docker-compose -f docker/docker-compose.yml up -d     # 2. DB 시작
# .env 파일 만들기 (4단계 참고)
pnpm prisma generate                                  # 3. 타입 생성
pnpm prisma migrate dev                               # 4. DB 스키마 적용
pnpm nx serve server                                  # 5. 서버 시작
# 다른 터미널에서:
pnpm nx serve admin                                   # 6. admin 시작
```

### 12-2. 새 기능 만들 때

[02-new-domain-recipe.md](02-new-domain-recipe.md) 참고.

### 12-3. DB 모델 추가/수정할 때

```bash
# 1. prisma/*.prisma 파일 수정
# 2. 마이그레이션 생성 + 적용
pnpm prisma migrate dev --name <설명>
# 3. 서버 자동 재시작 (코드도 변경됐다면)
```

### 12-4. 의존성 업데이트할 때

```bash
# 모든 패키지 최신화 (호환 범위 내)
pnpm update

# 특정 패키지 업데이트
pnpm update <패키지명>

# 메이저 버전 업그레이드 (호환 안 되는 변경 포함)
pnpm update --latest
```

업데이트 후 반드시 테스트.

### 12-5. 코드 정리 (linting/formatting)

```bash
# ESLint 검사
pnpm nx lint server
pnpm nx lint admin

# Prettier 적용 (있다면)
pnpm prettier --write .
```

### 12-6. 배포 준비

```bash
# 빌드
pnpm nx build server   # → dist/apps/server/
pnpm nx build admin    # → dist/apps/admin/browser/

# 빌드 결과를 서버에 올리고 실행
node dist/apps/server/main.js  # 서버 시작
# admin은 정적 파일을 nginx 등으로 서빙
```

실제 배포는 운영 서버 환경에 따라 다르므로 별도 학습 필요.

---

## 13. 유용한 단축키 / Tips

### 13-1. VSCode

| 단축키 | 동작 |
| --- | --- |
| `Ctrl+P` | 파일 빠르게 열기 |
| `Ctrl+Shift+P` | 명령 팔레트 |
| `Ctrl+클릭` (함수명) | 정의로 이동 |
| `F12` | 정의로 이동 (위와 같음) |
| `Shift+F12` | 모든 참조 찾기 |
| `F2` | 변수/함수 이름 일괄 변경 |
| `Ctrl+/` | 줄 주석 토글 |
| `Alt+↑/↓` | 줄 위/아래로 이동 |

### 13-2. 터미널

| 단축키 | 동작 |
| --- | --- |
| `↑/↓` | 이전 명령 |
| `Ctrl+R` | 이전 명령 검색 |
| `Ctrl+C` | 현재 명령 중지 |
| `Ctrl+L` 또는 `clear` | 화면 비우기 |

### 13-3. 브라우저 개발자 도구 (F12)

| 탭 | 용도 |
| --- | --- |
| Elements | HTML 구조 보기/수정 |
| Console | 로그 확인, JS 실행 |
| Network | HTTP 요청/응답 |
| Application | localStorage, cookies, etc. |
| Sources | JS 디버깅 (브레이크포인트) |

---

## 14. 도움이 필요할 때

### 14-1. 공식 문서

| 기술 | 문서 |
| --- | --- |
| NestJS | https://docs.nestjs.com/ |
| Angular | https://angular.dev/ |
| Prisma | https://www.prisma.io/docs |
| Nx | https://nx.dev/ |
| Tailwind | https://tailwindcss.com/docs |
| Docker | https://docs.docker.com/ |

### 14-2. 이 프로젝트의 학습 문서

- 함수/개념 사전: [LEARNING_GUIDE.md](../LEARNING_GUIDE.md)
- 컴포넌트 사용법: [apps/admin/src/app/components/README.md](../apps/admin/src/app/components/README.md)
- 흐름 추적: [01-flow-walkthrough.md](01-flow-walkthrough.md)
- 새 도메인 만들기: [02-new-domain-recipe.md](02-new-domain-recipe.md)
- 설계 이유: [03-architecture-decisions.md](03-architecture-decisions.md)

### 14-3. 문제 검색 팁

에러 메시지를 그대로 구글에 붙여넣기 (큰따옴표로 감싸기). 90% 이상 해결책이 나옴.

```
"Cannot find module '@prisma/client'" nestjs
```

---

## 15. 정리 — 매일 아침 루틴

매일 작업 시작할 때 이 순서대로:

1. **Docker Desktop 시작** (실행 중인지 확인)
2. **터미널 1**: DB 시작
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```
3. **터미널 2**: 서버 시작
   ```bash
   pnpm nx serve server
   ```
4. **터미널 3**: admin 시작
   ```bash
   pnpm nx serve admin
   ```
5. **브라우저**: `http://localhost:4200` 접속, 로그인
6. **VSCode**: 코드 작업

작업 끝나면 각 터미널에서 Ctrl+C로 종료. DB는 그대로 두거나 `docker-compose down`으로 멈춤.

---

이 가이드대로 따라하면 누구든 이 프로젝트를 자기 컴퓨터에서 실행할 수 있어요. 막히는 부분이 있으면 11번 디버깅 팁 섹션을 참고하세요.
