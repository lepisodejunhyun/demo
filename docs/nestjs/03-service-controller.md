# 서비스와 컨트롤러 — AdminService, AdminController

**파일 위치:**
- `apps/server/src/app/admin/admin.service.ts`
- `apps/server/src/app/admin/admin.controller.ts`

---

## 컨트롤러와 서비스의 역할 구분

식당에 비유하면:

```
손님(클라이언트) → 주문(HTTP 요청)
                        ↓
             웨이터(Controller)    ← 주문을 받고 주방에 전달
                        ↓
             요리사(Service)       ← 실제 요리(비즈니스 로직)를 담당
                        ↓
             식재료 창고(DB/Prisma) ← 재료 조회/저장
                        ↓
             웨이터(Controller)    ← 완성된 음식을 손님에게 전달
                        ↓
손님(클라이언트) ← 응답(HTTP 응답)
```

**Controller** — HTTP 요청을 받고 응답을 반환. "무슨 요청인지" 판단.

**Service** — 실제 비즈니스 로직 처리. "어떻게 처리할지" 담당.

---

## AdminController

**파일:** `apps/server/src/app/admin/admin.controller.ts`

```typescript
import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from "./admin.service";
import { plainToInstance } from "class-transformer";
import { AdminDTO } from "./dtos/admin.dto";
import { AdminSignInDTO } from "./dtos/admin-sign-in.dto";

@ApiTags('Admin')
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {};

  @Get('hello')
  @ApiOperation({ summary: '인사말'})
  gethello() {
    return this.adminService.getHello();
  }

  @Get()
  @ApiOperation({ summary: '관리자 전체 조회', description: '모든 관리자를 조회합니다.' })
  @ApiOkResponse({ description: '관리자 목록 조회 성공', type: AdminDTO, isArray: true })
  async findAll() {
    const admins = await this.adminService.findAll();
    return plainToInstance(AdminDTO, admins);
  }

  @Post('signin')
  @ApiOperation({ summary: '관리자 로그인', description: '관리자를 로그인합니다.' })
  @ApiOkResponse({ description: '로그인 성공', type: AdminDTO })
  async signin(@Body() data: AdminSignInDTO): Promise<AdminDTO> {
    const admin = await this.adminService.signIn(data);
    return plainToInstance(AdminDTO, admin);
  }
}
```

---

### `@Controller('admins')` — URL 접두사 등록

```typescript
@Controller('admins')
export class AdminController { ... }
```

이 컨트롤러의 모든 URL은 `/admins`로 시작해요.

`main.ts`에서 전역 접두사 `api`도 붙이기 때문에:

```
@Controller('admins') + setGlobalPrefix('api')
→ 모든 URL이 /api/admins 로 시작
```

---

### `@ApiTags('Admin')` — Swagger 그룹 분류

```typescript
@ApiTags('Admin')
```

Swagger UI에서 이 컨트롤러의 엔드포인트들을 "Admin" 그룹으로 묶어 표시해요.

---

### 의존성 주입

```typescript
constructor(private readonly adminService: AdminService) {};
```

컨트롤러도 서비스를 주입받아요. `AdminService` 인스턴스를 NestJS가 자동으로 넣어줘요.

---

### GET 엔드포인트 — `gethello`

```typescript
@Get('hello')
@ApiOperation({ summary: '인사말' })
gethello() {
  return this.adminService.getHello();
}
```

`@Get('hello')` → `GET /api/admins/hello` 요청을 처리해요.

아무 로직 없이 `adminService.getHello()`를 그냥 전달만 해요. 단순한 테스트용 엔드포인트예요.

---

### GET 엔드포인트 — `findAll`

```typescript
@Get()
@ApiOperation({
  summary: '관리자 전체 조회',
  description: '모든 관리자를 조회합니다.',
})
@ApiOkResponse({
  description: '관리자 목록 조회 성공',
  type: AdminDTO,
  isArray: true,
})
async findAll() {
  const admins = await this.adminService.findAll();
  return plainToInstance(AdminDTO, admins);
}
```

`@Get()` → `GET /api/admins` 요청을 처리해요. (경로 없음 = 컨트롤러 기본 경로)

**`@ApiOperation`** — Swagger 문서용 설명이에요.

```
summary: '관리자 전체 조회'  → 짧은 제목
description: '모든 관리자를 조회합니다.'  → 자세한 설명
```

**`@ApiOkResponse`** — 성공 응답의 형태를 Swagger에 알려줘요.

```
type: AdminDTO      → 응답이 AdminDTO 형태임
isArray: true       → 배열로 여러 개가 옴
```

이 정보 덕분에 Swagger가 응답 형태를 미리 문서화하고, `pnpm generate:api` 시 TypeScript 타입이 자동으로 생성돼요.

---

**`plainToInstance(AdminDTO, admins)`**

DB에서 가져온 데이터를 `AdminDTO`로 변환해요.

왜 변환이 필요하냐면:

```typescript
// DB에서 가져온 Admin 객체:
{
  id: "uuid-123",
  name: "홍길동",
  email: "admin@test.com",
  password: "$2a$10$hashedPassword...",  // ← 비밀번호가 포함되어 있음!
  role: "최고관리자",
  ...
}

// AdminDTO로 변환하면:
{
  id: "uuid-123",
  name: "홍길동",
  email: "admin@test.com",
  // password가 없음! @Exclude()가 자동으로 제거
  role: "최고관리자",
  ...
}
```

`AdminDTO`의 `@Exclude()` 데코레이터가 비밀번호 같은 민감한 정보를 자동으로 제거해줘요. (자세한 내용은 [04-dto-pattern.md](./04-dto-pattern.md) 참조)

---

### POST 엔드포인트 — `signin`

```typescript
@Post('signin')
@ApiOperation({
  summary: '관리자 로그인',
  description: '관리자를 로그인합니다.',
})
@ApiOkResponse({
  description: '로그인 성공',
  type: AdminDTO,
})
async signin(@Body() data: AdminSignInDTO): Promise<AdminDTO> {
  const admin = await this.adminService.signIn(data);
  return plainToInstance(AdminDTO, admin);
}
```

`@Post('signin')` → `POST /api/admins/signin` 요청을 처리해요.

**`@Body() data: AdminSignInDTO`**

```
클라이언트가 보낸 요청 body:
{
  "email": "admin@test.com",
  "password": "abc123!@#"
}
```

`@Body()`는 요청 body를 가져와요. `AdminSignInDTO` 타입으로 자동 변환되고, `ValidationPipe`가 유효성 검사를 해요.

**`Promise<AdminDTO>`**

이 함수는 비동기(`async`)여서 `AdminDTO`를 담은 Promise를 반환해요.

---

## AdminService

**파일:** `apps/server/src/app/admin/admin.service.ts`

```typescript
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Admin } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminSignInDTO } from "./dtos/admin-sign-in.dto";
import { compareSync } from "bcryptjs";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AdminEvents } from "./admin.const";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async findAll(): Promise<Admin[]> {
    const admins = await this.prisma.admin.findMany({});
    return admins;
  }

  async signIn(data: AdminSignInDTO): Promise<Admin> {
    const { email, password } = data;

    const admin = await this.prisma.admin.findFirst({
      where: {
        email: email,
        deletedAt: null,
      },
    });

    if (!admin) {
      throw new UnauthorizedException({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    const isPasswordValid = compareSync(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    this.eventEmitter.emit(AdminEvents.ADMIN_LOGGED_IN, { admin });

    return admin;
  }
}
```

---

### 두 가지 의존성 주입

```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly eventEmitter: EventEmitter2
) {}
```

두 가지를 주입받아요:
- `PrismaService` → DB 쿼리용
- `EventEmitter2` → 이벤트 발행용

---

### `findAll()` 메서드

```typescript
async findAll(): Promise<Admin[]> {
  const admins = await this.prisma.admin.findMany({});
  return admins;
}
```

`this.prisma.admin.findMany({})` — Admin 테이블의 모든 레코드를 조회해요.

`{}` 안에 조건을 추가할 수 있어요:

```typescript
// 예시: 삭제되지 않은 관리자만 조회
this.prisma.admin.findMany({
  where: {
    deletedAt: null,
  }
})
```

지금은 조건 없이 전체 조회해요.

`Promise<Admin[]>` — Admin 객체들의 배열을 반환하는 Promise예요.

---

### `signIn()` 메서드 — 로그인 로직

```typescript
async signIn(data: AdminSignInDTO): Promise<Admin> {
  const { email, password } = data;
  ...
}
```

**구조 분해 할당:**

```typescript
const { email, password } = data;
// 아래와 같은 의미:
const email = data.email;
const password = data.password;
```

---

**1단계: 이메일로 관리자 조회**

```typescript
const admin = await this.prisma.admin.findFirst({
  where: {
    email: email,
    deletedAt: null,  // 삭제된 계정은 제외
  },
});
```

`findFirst` — 조건에 맞는 첫 번째 레코드를 반환해요.

`deletedAt: null` — 소프트 삭제(Soft Delete) 패턴이에요. 실제로 DB에서 지우지 않고 `deletedAt`에 삭제 시간을 기록해요. 이 값이 `null`이면 삭제되지 않은 계정이에요.

---

**2단계: 존재 여부 확인**

```typescript
if (!admin) {
  throw new UnauthorizedException({
    message: '이메일 또는 비밀번호가 올바르지 않습니다.',
  });
}
```

관리자가 없으면 `UnauthorizedException`을 던져요.

`throw` — 에러를 발생시켜서 현재 함수 실행을 중단해요.

`UnauthorizedException` — NestJS가 제공하는 예외 클래스로, 자동으로 **HTTP 401 응답**을 반환해요.

**보안 포인트:** "이메일이 틀렸습니다" 또는 "비밀번호가 틀렸습니다"로 구분하지 않아요. 왜냐하면 구분하면 공격자가 "이 이메일이 존재하는구나"를 알 수 있거든요.

---

**3단계: 비밀번호 검증**

```typescript
const isPasswordValid = compareSync(password, admin.password);

if (!isPasswordValid) {
  throw new UnauthorizedException({
    message: '이메일 또는 비밀번호가 올바르지 않습니다.'
  });
}
```

`compareSync(password, admin.password)`

DB에 저장된 비밀번호는 암호화(해시)되어 있어요:

```
사용자가 입력:   "abc123!@#"
DB에 저장된 값:  "$2a$10$5zP8vXmK..."  ← bcrypt 해시

compareSync("abc123!@#", "$2a$10$5zP8vXmK...")
→ 입력값을 같은 방식으로 해시해서 DB 값과 비교
→ 일치하면 true, 불일치하면 false
```

왜 비밀번호를 그대로 저장하지 않냐면: DB가 해킹당해도 비밀번호를 알 수 없게 하기 위해서예요.

---

**4단계: 이벤트 발행**

```typescript
this.eventEmitter.emit(AdminEvents.ADMIN_LOGGED_IN, { admin });
```

로그인 성공 시 이벤트를 발행해요.

`AdminEvents.ADMIN_LOGGED_IN` → 이벤트 이름 (상수)
`{ admin }` → 이벤트와 함께 전달하는 데이터

이 이벤트를 `AdminListener`가 구독하고 있어서, 로그인 성공 로그를 남겨요.

**왜 직접 로그를 남기지 않고 이벤트를 쓰냐?**

나중에 로그인 성공 시 알림 이메일 보내기, Slack 알림 등 기능을 추가할 때, `signIn()` 함수를 수정하지 않고 새 Listener만 추가하면 돼요 (느슨한 결합, 확장성).

---

**5단계: 관리자 반환**

```typescript
return admin;
```

검증이 완료된 `Admin` 객체를 반환해요. (비밀번호 포함 — Controller에서 `plainToInstance`로 제거됨)

---

## 요청 처리 전체 흐름

`POST /api/admins/signin` 요청 시:

```
1. ValidationPipe (main.ts에서 전역 설정)
   → AdminSignInDTO 유효성 검사
   → email 형식 확인, password 길이 확인

2. AdminController.signin(@Body() data)
   → 요청 body를 AdminSignInDTO로 변환
   → adminService.signIn(data) 호출

3. AdminService.signIn(data)
   → prisma.admin.findFirst() → DB 조회
   → compareSync() → 비밀번호 비교
   → eventEmitter.emit() → 이벤트 발행
   → admin 객체 반환

4. AdminController (다시 돌아옴)
   → plainToInstance(AdminDTO, admin) → 비밀번호 제거
   → AdminDTO 반환

5. HTTP 응답 (200 OK)
   → {
        id: "...",
        email: "admin@test.com",
        name: "최고 관리자",
        role: "최고관리자",
        // password 없음!
        ...
      }
```

---

## 서비스와 컨트롤러 역할 요약

| | Controller | Service |
|---|---|---|
| 역할 | HTTP 요청/응답 처리 | 비즈니스 로직 |
| 담당 | URL 매핑, 데이터 변환 | DB 쿼리, 검증, 이벤트 |
| 데코레이터 | `@Get`, `@Post`, `@Body` | `@Injectable` |
| 의존성 | Service를 주입받음 | PrismaService, EventEmitter를 주입받음 |
| 테스트 | 요청/응답 형태 테스트 | 비즈니스 로직 단위 테스트 |
