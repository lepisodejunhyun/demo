# 모듈 시스템 — AppModule, AdminModule, PrismaModule

**파일 위치:**
- `apps/server/src/app/app.module.ts`
- `apps/server/src/app/admin/admin.module.ts`
- `apps/server/src/prisma/prisma.module.ts`
- `apps/server/src/prisma/prisma.service.ts`

---

## 모듈이란 무엇인가?

레고 블록을 생각해보세요.

레고로 집을 만들 때:
- 지붕 블록
- 벽 블록
- 창문 블록

이것들을 조립해서 집 전체를 만들잖아요.

NestJS에서 "모듈"이 바로 이 레고 블록이에요.

```
AppModule (집 전체)
├── PrismaModule (데이터베이스 블록)
├── AdminModule (관리자 기능 블록)
└── EventEmitterModule (이벤트 블록)
```

각 모듈은 독립적으로 동작하고, 조립해서 전체 앱을 만들어요.

---

## AppModule (루트 모듈)

**파일:** `apps/server/src/app/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [PrismaModule, AdminModule, EventEmitterModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### `@Module()` 데코레이터

클래스 위에 `@Module()`을 붙이면 NestJS가 이 클래스를 "모듈"로 인식해요.

`@Module()`에는 4가지 옵션이 있어요:

---

**`imports: [PrismaModule, AdminModule, EventEmitterModule.forRoot()]`**

다른 모듈을 가져와서 이 모듈에서 사용할 수 있게 해요.

```
PrismaModule         → 데이터베이스 연결 기능 가져오기
AdminModule          → 관리자 관련 기능 가져오기
EventEmitterModule   → 이벤트 발행/구독 기능 가져오기
```

`EventEmitterModule.forRoot()` — `forRoot()`는 "전체 앱에서 한 번만 초기화해서 공유해"라는 의미예요. 이벤트 버스를 싱글톤으로 만들어요.

---

**`controllers: [AppController]`**

이 모듈에서 HTTP 요청을 받는 컨트롤러를 등록해요.

```
AppController → GET /api 같은 기본 엔드포인트를 처리
```

---

**`providers: [AppService]`**

이 모듈에서 사용할 서비스(비즈니스 로직)를 등록해요.

```
AppService → 기본적인 서비스 로직 (지금은 간단한 "Hello World" 반환)
```

---

## AdminModule (기능 모듈)

**파일:** `apps/server/src/app/admin/admin.module.ts`

```typescript
import { Logger, Module, OnModuleInit } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PrismaService } from "../../prisma/prisma.service";
import { hashSync } from "bcryptjs";
import { AdminRole } from '@prisma/client';
import { AdminListener } from "./admin.listener";

@Module({
  imports: [],
  controllers: [AdminController],
  providers: [AdminService, AdminListener],
})
export class AdminModule implements OnModuleInit {
  private readonly logger = new Logger(AdminModule.name);
  private readonly defaultAdminEmail = process.env.DEFAULT_ADMIN_USERNAME || '';
  private readonly defaultAdminpassword = process.env.DEFAULT_ADMIN_PASSWORD || '';

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // 서버 시작 시 기본 최고관리자 생성 로직
    ...
  }
}
```

### AdminModule이 담당하는 것들

```
AdminModule
├── AdminController  → HTTP 요청 처리 (GET /api/admins, POST /api/admins/signin)
├── AdminService     → 비즈니스 로직 (로그인 검증, 관리자 조회)
└── AdminListener    → 이벤트 구독 (로그인 성공 이벤트 감지)
```

---

### `OnModuleInit` 인터페이스

```typescript
export class AdminModule implements OnModuleInit {
  async onModuleInit() {
    // 서버 시작 시 자동 실행
  }
}
```

`implements OnModuleInit` → "이 클래스는 `onModuleInit()` 메서드를 반드시 구현해야 해"

`onModuleInit()`은 NestJS가 모듈 초기화를 완료한 직후 자동으로 호출해요.

**이 프로젝트에서 하는 일:**

서버가 처음 시작될 때 기본 최고관리자 계정이 없으면 자동으로 생성해요.

```typescript
async onModuleInit() {
  // 환경변수에 기본 관리자 이메일/비밀번호가 없으면 경고하고 종료
  if (!this.defaultAdminEmail || !this.defaultAdminpassword) {
    this.logger.warn('최고 관리자 이메일 또는 비밀번호가 설정되지 않았습니다.');
    return;
  }

  // DB에 이미 있는지 확인
  const existingAdmin = await this.prisma.admin.findFirst({
    where: { email: this.defaultAdminEmail },
  });

  if (existingAdmin) {
    this.logger.log(`최고 관리자(${this.defaultAdminEmail})가 이미 존재합니다.`);
    return;
  }

  // 없으면 새로 생성
  await this.prisma.admin.create({
    data: {
      email: this.defaultAdminEmail,
      password: hashSync(this.defaultAdminpassword, 10),  // 비밀번호 암호화
      name: '최고 관리자',
      role: AdminRole.최고관리자,
    }
  });
}
```

---

### 의존성 주입 (Dependency Injection) ⭐

```typescript
constructor(private readonly prisma: PrismaService) {}
```

이게 NestJS에서 가장 중요한 개념이에요.

**의존성 주입이란?**

클래스가 필요한 도구를 직접 만들지 않고, 외부에서 받아서 쓰는 것이에요.

**주입 없이 하면:**

```typescript
class AdminModule {
  private prisma = new PrismaService();  // 직접 생성

  async doSomething() {
    await this.prisma.admin.findMany();
  }
}
```

문제점:
1. `AdminModule`이 만들어질 때마다 새 `PrismaService`가 생성됨 (메모리 낭비)
2. 테스트할 때 실제 DB가 연결되어야만 테스트 가능 (불편함)

**의존성 주입을 쓰면:**

```typescript
class AdminModule {
  constructor(private readonly prisma: PrismaService) {}
  // NestJS가 PrismaService를 만들어서 넣어줌
}
```

장점:
1. `PrismaService`는 앱 전체에서 딱 하나만 만들어져서 공유됨 (싱글톤, 메모리 절약)
2. 테스트할 때는 가짜 PrismaService를 넣어서 DB 없이 테스트 가능

**문법 설명:**

```typescript
constructor(private readonly prisma: PrismaService) {}
//          ^^^^^^^ ^^^^^^^  ^^^^^^ ^^^^^^^^^^^^
//          접근제한  수정금지  변수명  타입
```

- `private` → 이 클래스 안에서만 사용 가능
- `readonly` → 생성 후 변경 불가
- `prisma` → `this.prisma`로 접근하는 변수명
- `PrismaService` → 주입받을 타입 (NestJS가 이 타입을 보고 어떤 걸 넣을지 판단)

---

## PrismaModule (전역 모듈)

**파일:** `apps/server/src/prisma/prisma.module.ts`

```typescript
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### `@Global()` 데코레이터

`@Global()`을 붙이면 이 모듈의 exports를 **모든 모듈에서 자동으로 사용**할 수 있어요.

`@Global()` 없이 하면:

```typescript
// AdminModule에서 PrismaService 쓰고 싶으면
@Module({
  imports: [PrismaModule],  // ← 이걸 매번 써야 함
  ...
})
export class AdminModule {}

// UserModule, OrderModule 등 모든 모듈마다 imports에 PrismaModule 추가해야 함
```

`@Global()` 있으면:

```typescript
// AppModule에 한 번만 등록하면
@Module({
  imports: [PrismaModule, ...],  // ← 여기 한 번만
})
export class AppModule {}

// 다른 모든 모듈에서 자동으로 PrismaService 주입 가능
// AdminModule, UserModule 등에 imports: [PrismaModule] 안 써도 됨
```

---

### `exports: [PrismaService]`

모듈 밖에서도 `PrismaService`를 쓸 수 있도록 내보내요.

```
exports 없을 때:
  PrismaModule 내부에서만 PrismaService 사용 가능
  → AdminModule에서 PrismaService 못 씀

exports 있을 때:
  다른 모듈에서 PrismaService를 주입받을 수 있음
  → AdminModule에서 PrismaService 사용 가능
```

---

## PrismaService

**파일:** `apps/server/src/prisma/prisma.service.ts`

```typescript
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    await this.$executeRaw`SET TIME ZONE 'Asia/Seoul'`;
  }
}
```

### `@Injectable()` 데코레이터

```typescript
@Injectable()
export class PrismaService { ... }
```

`@Injectable()`을 붙이면 NestJS가 이 클래스를 **의존성 주입 가능한 프로바이더**로 인식해요.

즉, 다른 클래스의 생성자에서 `PrismaService`를 요청하면 NestJS가 자동으로 이 인스턴스를 넣어줘요.

---

### `extends PrismaClient`

```typescript
export class PrismaService extends PrismaClient
```

`extends`는 다른 클래스의 기능을 **상속**받는다는 의미예요.

`PrismaClient`는 Prisma가 제공하는 DB 클라이언트예요. `PrismaService`가 이걸 상속받아서 모든 DB 쿼리 기능을 그대로 사용해요.

```typescript
// PrismaClient가 가진 기능을 그대로 사용
await this.prisma.admin.findMany()    // Admin 테이블 조회
await this.prisma.admin.create(...)   // Admin 생성
await this.prisma.admin.findFirst(...)// 조건에 맞는 첫 번째 Admin 조회
```

---

### 생성자에서 PostgreSQL 연결 설정

```typescript
constructor() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  super({ adapter });
}
```

`PrismaPg` — PostgreSQL 전용 어댑터예요.

`process.env.DATABASE_URL` — `.env` 파일에 있는 DB 연결 문자열이에요.

```
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
```

`!` — "이 값이 undefined가 아님을 내가 보장한다"는 TypeScript 단언 연산자예요.

`super({ adapter })` — 부모 클래스(`PrismaClient`)의 생성자를 호출하면서 어댑터를 전달해요.

---

### `onModuleInit`에서 DB 연결 및 시간대 설정

```typescript
async onModuleInit() {
  await this.$connect();
  await this.$executeRaw`SET TIME ZONE 'Asia/Seoul'`;
}
```

`this.$connect()` — DB와 실제로 연결을 맺어요.

`SET TIME ZONE 'Asia/Seoul'` — DB 세션의 시간대를 한국(서울) 시간으로 설정해요.

이 설정이 없으면 DB에 저장되는 시간이 UTC(협정 세계시)로 저장돼서, 한국 시간과 9시간 차이가 생길 수 있어요.

---

## 세 모듈의 관계 정리

```
AppModule
├── imports: [PrismaModule, AdminModule, EventEmitterModule]
│
├── PrismaModule (@Global)
│   ├── providers: [PrismaService]
│   └── exports: [PrismaService]  ─────────────────────────┐
│                                                            │
└── AdminModule                                             │
    ├── controllers: [AdminController]                      │
    ├── providers: [AdminService, AdminListener]            │
    └── constructor(private readonly prisma: PrismaService) ←┘
        (PrismaService를 자동으로 주입받음)
```

---

## 모듈 시스템 요약

| 개념 | 설명 | 예시 |
|------|------|------|
| `@Module()` | 클래스를 모듈로 선언 | `@Module({ imports, controllers, providers })` |
| `imports` | 다른 모듈 가져오기 | `imports: [PrismaModule]` |
| `controllers` | HTTP 요청 처리 클래스 등록 | `controllers: [AdminController]` |
| `providers` | 서비스 클래스 등록 | `providers: [AdminService]` |
| `exports` | 다른 모듈에 공개 | `exports: [PrismaService]` |
| `@Global()` | 전역 모듈 선언 | 모든 모듈에서 자동 사용 가능 |
| `@Injectable()` | 주입 가능한 클래스 선언 | NestJS가 인스턴스를 관리 |
| `constructor(private x: X)` | 의존성 주입 | NestJS가 X의 인스턴스를 자동으로 주입 |
