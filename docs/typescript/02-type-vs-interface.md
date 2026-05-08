# type vs interface — 타입 선언의 두 가지 방법

---

## 왜 두 가지 방법이 있나?

객체의 형태를 정의할 때 TypeScript에는 두 가지 방법이 있어요.

```typescript
// 방법 1: type (타입 별칭)
type Admin = {
  id: string;
  name: string;
  email: string;
};

// 방법 2: interface (인터페이스)
interface Admin {
  id: string;
  name: string;
  email: string;
}
```

둘 다 `Admin` 타입을 만들고, 사용 방법도 거의 같아요.

```typescript
// 둘 다 이렇게 사용 가능
const admin: Admin = {
  id: "uuid-123",
  name: "홍길동",
  email: "admin@test.com",
};
```

그럼 뭐가 다를까요?

---

## `type` — 타입 별칭

"이 복잡한 타입에 이름을 붙이겠다"는 의미예요.

### 기본 사용법

```typescript
// 객체 형태 정의
type Admin = {
  id: string;
  name: string;
  email: string;
};

// 단순 타입에도 이름 붙이기
type UserId = string;             // string에 UserId라는 이름
type Score = number;              // number에 Score라는 이름
type IsActive = boolean;          // boolean에 IsActive라는 이름

// 복잡한 타입에 이름 붙이기
type AdminOrNull = Admin | null;          // Admin이거나 null
type AdminList = Admin[];                 // Admin 배열
type AdminCallback = (admin: Admin) => void;  // Admin을 받는 함수 타입
```

### `type`만 할 수 있는 것 — 유니온(Union) 타입

```typescript
// type은 | (or) 연산자로 여러 타입을 합칠 수 있어요
type StringOrNumber = string | number;
type AdminRole = '관리자' | '최고관리자';  // 딱 이 두 값만 허용

// 이 프로젝트에서 실제 사용 예 (libs/api-client/src/types.gen.ts)
export type AdminDto = {
  role: '관리자' | '최고관리자';  // type으로만 이렇게 표현 가능
  lastLoginAt?: string | null;
};
```

`interface`로는 이런 유니온 타입을 만들 수 없어요.

---

## `interface` — 인터페이스

"이 객체는 반드시 이런 형태여야 한다"는 **계약서** 같은 역할이에요.

### 기본 사용법

```typescript
interface Admin {
  id: string;
  name: string;
  email: string;
}
```

### `interface`만 할 수 있는 것 1 — 선언 병합(Declaration Merging)

같은 이름의 `interface`를 여러 번 선언하면 자동으로 합쳐져요.

```typescript
interface Admin {
  id: string;
  name: string;
}

interface Admin {
  email: string;  // 나중에 추가
}

// 최종 Admin은 id + name + email 모두 포함
const admin: Admin = {
  id: "uuid-123",
  name: "홍길동",
  email: "admin@test.com",  // 없으면 에러
};
```

`type`은 같은 이름을 두 번 선언하면 에러가 나요:

```typescript
type Admin = { id: string };
type Admin = { name: string };  // ← 에러! 중복 선언 불가
```

### `interface`만 할 수 있는 것 2 — `implements`로 클래스에 강제 적용

```typescript
interface Loggable {
  log(message: string): void;
}

// 이 클래스는 반드시 log() 메서드를 구현해야 해요
class AdminService implements Loggable {
  log(message: string): void {
    console.log(`[AdminService] ${message}`);
  }
}

class OrderService implements Loggable {
  // log()가 없으면 에러!
}
```

---

## `extends` — 상속 (둘 다 가능)

기존 타입/인터페이스를 확장해서 새로운 타입을 만들어요.

### interface extends interface

```typescript
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface Admin extends BaseEntity {
  name: string;
  email: string;
  password: string;
}

// Admin은 BaseEntity의 필드 + 자기 필드를 모두 가짐
// id, createdAt, updatedAt, deletedAt, name, email, password
```

### type extends type (& 연산자 사용)

```typescript
type BaseEntity = {
  id: string;
  createdAt: Date;
};

type Admin = BaseEntity & {  // & 는 "그리고"
  name: string;
  email: string;
};
// Admin은 BaseEntity + name + email 모두 가짐
```

### interface extends type (서로 혼합도 가능)

```typescript
type BaseEntity = {
  id: string;
  createdAt: Date;
};

interface Admin extends BaseEntity {  // type을 extends 가능
  name: string;
}
```

---

## 옵셔널 필드와 읽기 전용 필드

### `?` — 있어도 되고 없어도 되는 필드

```typescript
interface Admin {
  id: string;
  name: string;
  lastLoginAt?: Date;    // ? 있으면 선택적 (없어도 OK)
  deletedAt?: Date | null;
}

// lastLoginAt 없어도 OK
const admin: Admin = {
  id: "uuid-123",
  name: "홍길동",
};

// lastLoginAt 있어도 OK
const admin2: Admin = {
  id: "uuid-456",
  name: "김철수",
  lastLoginAt: new Date(),
};
```

### `readonly` — 수정 불가 필드

```typescript
interface Admin {
  readonly id: string;  // 한 번 정하면 변경 불가
  name: string;
}

const admin: Admin = { id: "uuid-123", name: "홍길동" };
admin.name = "김철수";    // OK
admin.id = "new-uuid";   // ← 에러! readonly는 수정 불가
```

---

## 이 프로젝트에서 실제 사용 예

### `type` 사용 — `types.gen.ts` (자동 생성 파일)

```typescript
// libs/api-client/src/types.gen.ts
export type AdminDto = {
  id: string;
  email: string;
  name: string;
  role: '관리자' | '최고관리자';  // 유니온 타입 → type만 가능
  failCount: number;
  lockedUntil: string;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};
```

### `interface` 사용 — NestJS/Angular 클래스에서

```typescript
// NestJS의 OnModuleInit 인터페이스
interface OnModuleInit {
  onModuleInit(): void;
}

// 이 프로젝트에서 실제 사용 (admin.module.ts)
export class AdminModule implements OnModuleInit {
  async onModuleInit() {  // 반드시 구현해야 함
    // 기본 관리자 생성 로직
  }
}
```

---

## `type` vs `interface` 언제 쓸지

### `type`을 쓰는 경우

```typescript
// 1. 유니온 타입이 필요할 때
type Status = 'active' | 'inactive' | 'deleted';

// 2. 기본 타입에 별명을 붙일 때
type UserId = string;

// 3. 함수 타입을 정의할 때
type ClickHandler = (event: MouseEvent) => void;

// 4. 자동 생성 코드 (openapi-ts가 type을 사용)
```

### `interface`를 쓰는 경우

```typescript
// 1. 클래스가 구현해야 할 계약 (implements)
interface Serializable {
  serialize(): string;
}

// 2. 나중에 확장될 가능성이 있는 타입
interface Config {
  baseUrl: string;
}
// 라이브러리 사용자가 나중에 선언 병합으로 확장 가능

// 3. 객체의 형태만 정의할 때 (개인 선호)
```

### 실무 가이드라인

```
객체 형태 정의 → type과 interface 둘 다 OK, 팀 규칙 따르기
유니온 타입    → type만 가능
클래스 계약    → interface + implements
자동 생성 코드 → 도구가 결정 (이 프로젝트는 type 사용)
```

**결론:** 객체 형태 정의에는 둘 다 쓸 수 있어요. 유니온 타입이 필요하거나 기본 타입에 이름을 붙이려면 `type`, 클래스와 함께 쓰거나 나중에 확장이 필요하면 `interface`를 선택해요.
