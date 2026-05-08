# 교차 타입(Intersection Types) — "이것도 저것도 모두 만족해야 해"

---

## 교차 타입이란?

`&` (앰퍼샌드) 기호로 여러 타입을 합쳐서 **모든 속성을 가진 타입**을 만드는 거예요.

```
Union 타입   → A 또는 B  (둘 중 하나)
교차 타입    → A 그리고 B (둘 다)
```

마치 여러 가지 능력을 동시에 가진 캐릭터처럼요.

```typescript
type A = { name: string };
type B = { age: number };

type AB = A & B;
// AB는 name도 있고 age도 있어야 해요
// { name: string; age: number }

const person: AB = { name: "홍길동", age: 25 };  // OK!
const person2: AB = { name: "홍길동" };           // ← 에러! age 없음
```

---

## 기본 사용법

### 두 타입 합치기

```typescript
type PersonInfo = {
  name: string;
  email: string;
};

type AdminPermission = {
  role: '관리자' | '최고관리자';
  canDelete: boolean;
};

// 두 타입을 합친 새 타입
type AdminWithInfo = PersonInfo & AdminPermission;
// {
//   name: string;
//   email: string;
//   role: '관리자' | '최고관리자';
//   canDelete: boolean;
// }

const admin: AdminWithInfo = {
  name: "홍길동",
  email: "admin@test.com",
  role: "관리자",
  canDelete: false,
};
```

### 세 개 이상 합치기

```typescript
type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type BaseEntity = {
  id: string;
};

type Admin = BaseEntity & PersonInfo & Timestamps;
// id + name + email + createdAt + updatedAt + deletedAt 모두 필요
```

---

## `interface extends` vs `&`

두 방법 모두 타입을 합칠 수 있어요.

```typescript
// interface extends interface
interface PersonInfo {
  name: string;
  email: string;
}

interface Admin extends PersonInfo {
  role: string;
}

// type & type
type PersonInfoType = {
  name: string;
  email: string;
};

type AdminType = PersonInfoType & { role: string };
```

### 차이점

```typescript
// interface extends — 속성 충돌 시 에러
interface A { value: string }
interface B extends A { value: number }  // ← 에러! string ≠ number

// type & — 속성 충돌 시 never 타입이 됨
type A = { value: string };
type B = { value: number };
type C = A & B;
// C.value 타입 = string & number = never (존재 불가)
// C 자체는 에러 없이 만들어지지만 실제로 사용할 수 없음
```

---

## 이 프로젝트에서 실제 사용 패턴

### DTO 타입 확장

```typescript
// 기본 AdminDto
type AdminDto = {
  id: string;
  name: string;
  email: string;
  role: '관리자' | '최고관리자';
};

// 추가 정보가 필요한 경우
type AdminWithStats = AdminDto & {
  loginCount: number;
  lastActivity: Date | null;
};
```

### 함수 매개변수 타입 합치기

```typescript
type PaginationOptions = {
  page: number;
  pageSize: number;
};

type SearchOptions = {
  keyword?: string;
  role?: '관리자' | '최고관리자';
};

// 페이지네이션 + 검색 옵션 모두 받는 함수
function findAdmins(options: PaginationOptions & SearchOptions) {
  const { page, pageSize, keyword, role } = options;
  // 모든 속성 사용 가능
}

findAdmins({ page: 1, pageSize: 10, keyword: "홍길동" });  // OK!
```

---

## Union vs Intersection 비교

```typescript
type Admin = { role: '관리자'; canWrite: boolean };
type SuperAdmin = { role: '최고관리자'; canDelete: boolean };

// Union — Admin이거나 SuperAdmin
type AnyAdmin = Admin | SuperAdmin;
// role: '관리자' | '최고관리자' (공통 속성만 직접 접근)
// canWrite, canDelete은 타입 가드 없이는 접근 불가

// Intersection — Admin이면서 SuperAdmin
type FullAdmin = Admin & SuperAdmin;
// role: '관리자' & '최고관리자' = never (불가능한 조합)
// canWrite: boolean
// canDelete: boolean
```

교차 타입은 **두 타입을 동시에 만족**해야 하므로, 논리적으로 불가능한 조합은 `never`가 돼요.

---

## 믹스인(Mixin) 패턴

여러 기능을 조합해서 새 타입을 만드는 패턴이에요.

```typescript
// 타임스탬프가 있는 엔티티
type WithTimestamps = {
  createdAt: Date;
  updatedAt: Date;
};

// 소프트 삭제가 있는 엔티티
type WithSoftDelete = {
  deletedAt: Date | null;
};

// 둘 다 있는 완전한 엔티티
type FullEntity<T> = T & WithTimestamps & WithSoftDelete;

// Admin 엔티티
type Admin = FullEntity<{
  id: string;
  name: string;
  email: string;
  role: '관리자' | '최고관리자';
}>;

// 최종 Admin 타입:
// id + name + email + role + createdAt + updatedAt + deletedAt
```

---

## 교차 타입과 제네릭 함께 사용

```typescript
// 어떤 타입이든 타임스탬프를 추가하는 유틸
function withTimestamps<T>(obj: T): T & { createdAt: Date; updatedAt: Date } {
  return {
    ...obj,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const admin = withTimestamps({ id: "1", name: "홍길동" });
// admin: { id: string; name: string; createdAt: Date; updatedAt: Date }

admin.id;         // OK
admin.createdAt;  // OK
```

---

## 정리

```
A & B = A의 모든 속성 + B의 모든 속성 (둘 다 필요)

사용 사례:
  기존 타입에 속성 추가     → BaseType & { newProp: string }
  여러 타입 조합            → TypeA & TypeB & TypeC
  믹스인 패턴               → WithTimestamps & WithSoftDelete & Entity

Union(|) vs Intersection(&):
  | → "A 또는 B" — 하나만 만족하면 됨
  & → "A 그리고 B" — 둘 다 만족해야 함
```
