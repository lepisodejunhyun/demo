# 열거형(Enum) — "정해진 값들의 모음"

---

## Enum이란?

"이 변수는 반드시 이 목록에 있는 값 중 하나여야 해"라고 정의하는 거예요.

예를 들어 요일은 월, 화, 수, 목, 금, 토, 일 중 하나예요. "달요일"이나 "목금일" 같은 건 없죠.

```typescript
// Enum 없이 하면 이런 실수가 생길 수 있어요
function setRole(role: string) {
  // role에 뭐든 넣을 수 있어요 — 오타도, 이상한 값도
}

setRole("admin");      // OK (맞아요)
setRole("Amdin");      // OK? (오타지만 에러 없음!)
setRole("superuser");  // OK? (정의되지 않은 값)
```

---

## TypeScript Enum 기본 문법

```typescript
enum AdminRole {
  Admin = '관리자',
  SuperAdmin = '최고관리자',
}

// 사용
let role = AdminRole.Admin;       // '관리자'
let role2 = AdminRole.SuperAdmin; // '최고관리자'

function setRole(role: AdminRole) {
  // role은 반드시 AdminRole 값 중 하나여야 해요
}

setRole(AdminRole.Admin);       // OK!
setRole('관리자');               // ← 에러! (strictNullChecks 설정에 따라 다를 수 있음)
setRole('Amdin');               // ← 에러! — 오타 방지
```

---

## Enum의 종류

### 숫자 Enum (Numeric Enum)

기본 Enum은 숫자로 자동 할당돼요.

```typescript
enum Direction {
  Up,     // 0
  Down,   // 1
  Left,   // 2
  Right,  // 3
}

console.log(Direction.Up);    // 0
console.log(Direction.Down);  // 1

// 시작 번호 지정
enum Status {
  Active = 1,
  Inactive,  // 2 (자동 증가)
  Deleted,   // 3 (자동 증가)
}
```

### 문자열 Enum (String Enum)

각 값에 문자열을 직접 할당해요. 이 프로젝트에서 사용하는 방식이에요.

```typescript
enum AdminRole {
  Admin = '관리자',
  SuperAdmin = '최고관리자',
}

// DB에 저장될 때 '관리자' 또는 '최고관리자' 문자열로 저장
// 코드에서는 AdminRole.Admin처럼 의미 있는 이름으로 사용
```

---

## 이 프로젝트에서 Enum 사용 방식

### Prisma 스키마에서 Enum 정의

```prisma
// prisma/admin.prisma
enum AdminRole {
  관리자
  최고관리자
}

model Admin {
  id    String    @id @default(uuid())
  role  AdminRole @default(관리자)
}
```

Prisma에서 이 enum을 정의하면:
1. DB에 `AdminRole` 타입이 생성돼요
2. TypeScript 코드에서도 `AdminRole` 타입으로 사용할 수 있어요

### 자동 생성된 타입 (types.gen.ts)

```typescript
// libs/api-client/src/types.gen.ts (자동 생성)
export type AdminDto = {
  role: '관리자' | '최고관리자';  // ← Prisma enum이 Union 타입으로 변환됨
};
```

`@hey-api/openapi-ts`가 Prisma enum을 TypeScript **유니온 타입**으로 변환해요.

---

## TypeScript Union 타입 vs Enum — 이 프로젝트의 선택

### 유니온 타입 (이 프로젝트 방식)

```typescript
type AdminRole = '관리자' | '최고관리자';

const role: AdminRole = '관리자';  // OK
```

### Enum 방식

```typescript
enum AdminRole {
  Admin = '관리자',
  SuperAdmin = '최고관리자',
}

const role = AdminRole.Admin;  // '관리자'
```

### 차이점과 선택 기준

```typescript
// 유니온 타입의 장점
type Role = '관리자' | '최고관리자';
// → 자동 생성 코드(openapi-ts)와 잘 맞음
// → 타입 시스템에서 사라짐 (런타임 코드 없음)
// → 직관적으로 값을 바로 볼 수 있음

// Enum의 장점
enum Role {
  Admin = '관리자',
  SuperAdmin = '최고관리자',
}
// → Role.Admin처럼 네임스페이스로 정리됨
// → 런타임에도 객체로 존재 (switch문 등에서 사용 가능)
// → 자동완성이 더 잘 됨
```

이 프로젝트는 API 자동 생성 때문에 **유니온 타입**을 주로 사용하지만, 서버 내부 코드에서는 **Prisma의 enum**을 직접 사용할 수 있어요.

---

## Enum 사용 예시 — NestJS에서

```typescript
import { AdminRole } from '@prisma/client';
// Prisma가 생성한 enum을 import

@Injectable()
export class AdminService {
  async findAdmins(role?: AdminRole) {
    return await this.prisma.admin.findMany({
      where: role ? { role } : undefined,
    });
  }
}

// 호출할 때
adminService.findAdmins(AdminRole.관리자);
// AdminRole.관리자 → '관리자'
```

---

## Const Enum — 성능 최적화

```typescript
const enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
}

// 컴파일하면 enum 객체 없이 값이 직접 인라인됨
const dir = Direction.Up;
// 컴파일 결과: const dir = "UP"  (enum 객체 없음)
```

일반 enum은 런타임에 객체가 남지만, `const enum`은 컴파일 후 값만 남아요.

---

## Enum 역방향 매핑 (숫자 Enum만)

숫자 Enum은 값으로 이름을 찾을 수 있어요.

```typescript
enum Direction {
  Up = 0,
  Down = 1,
}

console.log(Direction[0]);  // "Up"  — 역방향 접근
console.log(Direction[1]);  // "Down"

// 문자열 Enum은 역방향 매핑 없음
enum AdminRole {
  Admin = '관리자',
}
// AdminRole['관리자']  ← 동작 안 함!
```

---

## Enum vs 유니온 타입 — 언제 무엇을 쓸까

```
자동 생성 코드, API 타입     → 유니온 타입 (이 프로젝트의 선택)
서버 비즈니스 로직           → Prisma enum (@prisma/client)
런타임에 enum 값 반복 필요   → TypeScript enum
간단한 리터럴 목록           → 유니온 타입 (더 단순)
```

---

## 실전 패턴 — enum 값으로 분기

```typescript
// Prisma의 AdminRole enum 사용
import { AdminRole } from '@prisma/client';

function getPermissions(role: AdminRole): string[] {
  switch (role) {
    case AdminRole.최고관리자:
      return ['read', 'write', 'delete', 'manage'];
    case AdminRole.관리자:
      return ['read', 'write'];
    default:
      // 이 코드에 도달하면 처리 안 된 케이스가 있다는 뜻
      const _exhaustive: never = role;
      return [];
  }
}
```

---

## 정리

```
enum — 정해진 값들의 집합
숫자 enum   → 자동으로 0, 1, 2...
문자열 enum → 직접 값 지정
const enum  → 런타임 객체 없이 값만 인라인됨

이 프로젝트:
  Prisma 스키마 → enum 정의
  TypeScript    → 유니온 타입으로 자동 변환 (openapi-ts)
  서버 로직     → @prisma/client의 enum 직접 사용 가능
```
