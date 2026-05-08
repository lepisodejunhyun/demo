# Prisma 에러 처리 — 자주 발생하는 에러와 대응 방법

---

## Prisma 에러의 종류

Prisma는 에러 상황에 따라 세 가지 타입의 에러를 던져요.

| 에러 타입 | 언제 발생 | 예시 |
|-----------|-----------|------|
| `PrismaClientKnownRequestError` | 예측 가능한 DB 에러 | 고유값 중복, FK 위반 등 |
| `PrismaClientUnknownRequestError` | 예측 불가 DB 에러 | 알 수 없는 쿼리 에러 |
| `PrismaClientInitializationError` | DB 연결 실패 | DB 서버 꺼짐, URL 오류 |

실무에서 가장 자주 다루는 건 `PrismaClientKnownRequestError`예요.

---

## `PrismaClientKnownRequestError` 에러 코드

에러 코드로 어떤 종류의 에러인지 구분해요.

### P2002 — 고유값(unique) 중복

```
에러 상황: @unique 필드에 이미 있는 값을 저장하려 할 때
예시: 이미 있는 이메일로 관리자를 생성하려 할 때
```

```typescript
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

try {
  await prisma.admin.create({
    data: {
      email: 'already@exists.com',  // 이미 DB에 있는 이메일
      password: '...',
      name: '...',
    }
  });
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // error.meta.target → 중복된 필드 이름
      console.log('중복된 필드:', error.meta?.target);
      // 출력: ['email']
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }
  }
  throw error;  // 다른 에러는 그대로 던지기
}
```

---

### P2025 — 레코드를 찾을 수 없음

```
에러 상황: update, delete를 할 때 조건에 맞는 레코드가 없을 때
예시: 없는 id로 update를 시도할 때
```

```typescript
try {
  await prisma.admin.update({
    where: { id: '존재하지-않는-uuid' },
    data: { name: '새 이름' },
  });
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      throw new NotFoundException('해당 관리자를 찾을 수 없습니다.');
    }
  }
  throw error;
}
```

**`findFirst`와 차이점:**

```typescript
// findFirst는 없으면 null 반환 (에러 아님)
const admin = await prisma.admin.findFirst({ where: { id: '없는id' } });
// admin === null

// update는 없으면 P2025 에러 throw
await prisma.admin.update({ where: { id: '없는id' }, data: {...} });
// PrismaClientKnownRequestError: P2025
```

---

### P2003 — 외래키(FK) 제약 조건 위반

```
에러 상황: 존재하지 않는 다른 모델의 id를 참조할 때
예시: 없는 adminId로 LoginLog를 생성하려 할 때
```

```typescript
try {
  await prisma.loginLog.create({
    data: {
      adminId: '존재하지-않는-uuid',  // Admin 테이블에 없는 id
      loginAt: new Date(),
    }
  });
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      throw new BadRequestException('유효하지 않은 관리자 ID입니다.');
    }
  }
  throw error;
}
```

---

### 자주 쓰는 에러 코드 전체 목록

| 코드 | 상황 |
|------|------|
| `P2002` | `@unique` 필드 중복 |
| `P2003` | 외래키(FK) 참조 대상 없음 |
| `P2025` | `update`/`delete` 시 레코드 없음 |
| `P2000` | 값이 DB 컬럼 크기 초과 |
| `P2001` | `where` 조건에 맞는 레코드 없음 |
| `P2011` | `NOT NULL` 필드에 `null` 저장 시도 |
| `P2014` | 관계 위반 (필수 관계 삭제 시도) |

---

## NestJS에서 Prisma 에러 처리 패턴

### 방법 1: 서비스에서 직접 처리

```typescript
// admin.service.ts

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AdminService {
  async create(data: CreateAdminDto) {
    try {
      return await this.prisma.admin.create({ data });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('이미 사용 중인 이메일입니다.');
        }
      }
      throw error;
    }
  }
}
```

---

### 방법 2: 전용 에러 처리 함수 분리

에러 처리 로직이 반복되면 함수로 분리해요.

```typescript
// prisma-exception.ts 같은 유틸 파일

import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export function handlePrismaError(error: unknown): never {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new ConflictException(
          `이미 존재하는 값입니다: ${error.meta?.target}`
        );
      case 'P2025':
        throw new NotFoundException('해당 레코드를 찾을 수 없습니다.');
      case 'P2003':
        throw new BadRequestException('참조하는 데이터가 존재하지 않습니다.');
    }
  }
  throw error;
}

// 사용
async create(data: CreateAdminDto) {
  try {
    return await this.prisma.admin.create({ data });
  } catch (error) {
    handlePrismaError(error);
  }
}
```

---

## DB 연결 에러 (`PrismaClientInitializationError`)

```typescript
// prisma.service.ts에서 처리

import { Injectable, OnModuleInit, Logger } from "@nestjs/common";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('데이터베이스 연결 성공');
    } catch (error) {
      this.logger.error('데이터베이스 연결 실패', error);
      // 연결 실패 시 앱 자체를 종료하는 게 나을 수 있음
      process.exit(1);
    }
  }
}
```

---

## 안전하게 쿼리하는 패턴들

### `findFirst` + 수동 확인 (P2025 방지)

`update`/`delete` 전에 먼저 존재 여부를 확인해요.

```typescript
async updateAdmin(id: string, data: UpdateAdminDto) {
  // 먼저 확인
  const admin = await this.prisma.admin.findFirst({
    where: { id, deletedAt: null }
  });

  if (!admin) {
    throw new NotFoundException('관리자를 찾을 수 없습니다.');
  }

  // 확인 후 수정
  return await this.prisma.admin.update({
    where: { id },
    data,
  });
}
```

---

### `findUniqueOrThrow` / `findFirstOrThrow`

찾지 못하면 자동으로 에러를 던지는 편의 메서드예요.

```typescript
// findUnique + null 체크를 한 번에
const admin = await prisma.admin.findUniqueOrThrow({
  where: { id: 'uuid-123' },
});
// 없으면 자동으로 P2025 에러 throw

// findFirst + null 체크를 한 번에
const admin = await prisma.admin.findFirstOrThrow({
  where: { email: 'admin@test.com', deletedAt: null },
});
```

```typescript
// 서비스에서 활용
async findOne(id: string) {
  try {
    return await this.prisma.admin.findUniqueOrThrow({
      where: { id }
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException(`관리자(${id})를 찾을 수 없습니다.`);
    }
    throw error;
  }
}
```

---

## 트랜잭션 에러 처리

트랜잭션 안에서 에러가 나면 전체가 롤백돼요.

```typescript
async transferPermission(fromAdminId: string, toAdminId: string, permissionId: string) {
  try {
    await this.prisma.$transaction(async (tx) => {
      // 1. 원래 관리자에게서 권한 제거
      await tx.adminPermission.delete({
        where: {
          adminId_permissionId: {  // @@unique 복합키
            adminId: fromAdminId,
            permissionId,
          }
        }
      });

      // 2. 새 관리자에게 권한 부여
      await tx.adminPermission.create({
        data: { adminId: toAdminId, permissionId }
      });
      // 여기서 에러 나면 1번도 취소됨!
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('해당 권한 정보를 찾을 수 없습니다.');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('이미 해당 권한을 보유하고 있습니다.');
      }
    }
    throw error;
  }
}
```

---

## `update` 시 `upsert` 활용으로 P2025 방지

```typescript
// update: 없으면 P2025 에러
await prisma.admin.update({ where: { id }, data });

// upsert: 없으면 생성, 있으면 수정 (에러 없음)
await prisma.admin.upsert({
  where: { id },
  update: data,
  create: { id, ...data },
});
```

항상 `upsert`가 좋은 건 아니에요. "없는 데이터를 수정하려 하면 에러를 내야 한다"는 비즈니스 로직이라면 `update` + 에러 처리가 더 적절해요.

---

## NestJS HTTP 예외 클래스 정리

Prisma 에러를 NestJS HTTP 예외로 변환할 때 쓰는 클래스들이에요.

```typescript
import {
  NotFoundException,      // 404: 리소스 없음
  ConflictException,      // 409: 중복/충돌
  BadRequestException,    // 400: 잘못된 요청
  UnauthorizedException,  // 401: 인증 필요
  ForbiddenException,     // 403: 권한 없음
  InternalServerErrorException, // 500: 서버 에러
} from '@nestjs/common';
```

| Prisma 에러 | HTTP 예외 | 상태 코드 |
|-------------|-----------|-----------|
| P2002 (고유값 중복) | `ConflictException` | 409 |
| P2025 (레코드 없음) | `NotFoundException` | 404 |
| P2003 (FK 위반) | `BadRequestException` | 400 |
| DB 연결 실패 | `InternalServerErrorException` | 500 |
| 인증 실패 | `UnauthorizedException` | 401 |

---

## 이 프로젝트의 현재 에러 처리

`admin.service.ts`의 `signIn()` 메서드:

```typescript
// 1. 관리자 없음 → UnauthorizedException (401)
if (!admin) {
  throw new UnauthorizedException({
    message: '이메일 또는 비밀번호가 올바르지 않습니다.',
  });
}

// 2. 비밀번호 틀림 → UnauthorizedException (401)
if (!isPasswordValid) {
  throw new UnauthorizedException({
    message: '이메일 또는 비밀번호가 올바르지 않습니다.'
  });
}
```

현재는 Prisma 에러 처리가 없어요. 실제 서비스라면 관리자 생성 API에서 P2002 처리가 필요해요.

```typescript
// 앞으로 관리자 생성 기능 추가 시 예시
async create(data: CreateAdminDto) {
  try {
    return await this.prisma.admin.create({ data });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }
    throw error;
  }
}
```
