# 타입 추론(Type Inference) — "TypeScript가 알아서 타입을 파악해요"

---

## 타입 추론이란?

타입을 직접 안 써도 TypeScript가 **값을 보고 타입을 자동으로 파악**하는 거예요.

```typescript
// 타입을 직접 명시한 경우
let name: string = "홍길동";

// 타입 추론 — 직접 쓰지 않아도 TypeScript가 string으로 파악
let name = "홍길동";  // TypeScript: "이건 string이네!"
```

TypeScript는 굉장히 똑똑해서 대부분의 상황에서 타입을 자동으로 추론할 수 있어요.

---

## 기본 추론

### 변수 선언 시

```typescript
let str = "hello";      // string
let num = 42;           // number
let flag = true;        // boolean
let nothing = null;     // null
let undef = undefined;  // undefined

const arr = [1, 2, 3];  // number[]
const obj = { id: "1", name: "홍길동" };  // { id: string; name: string }
```

### 함수 반환값

```typescript
// 반환 타입을 명시하지 않아도 추론됨
function add(a: number, b: number) {
  return a + b;  // 반환 타입: number (TypeScript가 파악)
}

function greet(name: string) {
  return `안녕하세요, ${name}님`;  // 반환 타입: string
}

function getAdminOrNull(id: string) {
  if (id === "1") {
    return { id, name: "홍길동" };  // { id: string; name: string }
  }
  return null;  // null
}
// 최종 반환 타입: { id: string; name: string } | null
```

---

## `const` vs `let` 추론 차이

```typescript
// const — 리터럴 타입으로 추론 (변경 불가니까 정확한 값)
const role = '관리자';  // 타입: '관리자' (string이 아닌 정확한 값)
const count = 5;        // 타입: 5 (number가 아닌 정확한 값)

// let — 넓은 타입으로 추론 (나중에 변경될 수 있으니까)
let role = '관리자';    // 타입: string (나중에 다른 string으로 바꿀 수 있음)
let count = 5;          // 타입: number (나중에 다른 number로 바꿀 수 있음)
```

이게 왜 중요하냐면:

```typescript
// const로 선언하면 타입이 정확해서 더 강한 타입 검사를 받아요
const role = '관리자';
function setRole(r: '관리자' | '최고관리자') {}
setRole(role);  // OK! '관리자' 타입이므로

// let으로 선언하면 string이라서 에러
let role2 = '관리자';
setRole(role2);  // ← 에러! string은 '관리자' | '최고관리자'보다 넓음
```

---

## 이 프로젝트에서 추론 활용

### 함수 반환 타입 추론

```typescript
// 반환 타입 명시 없어도 OK — TypeScript가 추론
function getAdminName(admin: AdminDto) {
  return admin.name;  // 반환 타입: string (자동 추론)
}

// 명시적으로 쓴 경우
function getAdminName(admin: AdminDto): string {
  return admin.name;
}
// 둘 다 동일하게 동작 — 명시는 선택사항
```

### Signal 타입 추론

```typescript
// admin.store.ts
// signal(null)이면 signal<null>(null)로 추론 → null만 담을 수 있음
// 그래서 명시적으로 타입을 지정해야 해요
readonly user = signal<AdminDto | null>(null);

// 반면 이건 자동 추론 가능
readonly loadingCount = signal(0);  // signal<number>로 자동 추론
```

### Prisma 쿼리 결과 추론

```typescript
// TypeScript가 Prisma 타입 정보를 보고 자동 추론
const admin = await this.prisma.admin.findFirst({ where: { id } });
// admin: Admin | null  (자동 추론!)

const admins = await this.prisma.admin.findMany({});
// admins: Admin[]  (자동 추론!)
```

---

## 타입 추론이 복잡해지는 경우

### 빈 배열

```typescript
// 빈 배열은 타입을 추론할 수 없어요
const arr = [];  // never[] — 어떤 것도 넣을 수 없음!

arr.push("hello");  // ← 에러! never[]에는 아무것도 못 넣어요

// 타입을 명시해야 해요
const arr: string[] = [];
arr.push("hello");  // OK!
```

### 복잡한 객체

```typescript
// TypeScript가 추론하지만 타입이 너무 구체적
const config = {
  port: 3000,
  host: "localhost",
};
// config: { port: number; host: string }
// port의 타입이 3000이 아닌 number로 추론됨

// 정확한 타입이 필요하면 as const 또는 타입 명시
const config = {
  port: 3000,
  host: "localhost",
} as const;
// config: { readonly port: 3000; readonly host: "localhost" }
```

---

## `typeof` — 값에서 타입 추출

기존 값의 타입을 재사용할 때 써요.

```typescript
const admin = {
  id: "uuid-1",
  name: "홍길동",
  email: "admin@test.com",
};

// admin의 타입을 그대로 사용
type AdminShape = typeof admin;
// { id: string; name: string; email: string }

function copyAdmin(source: typeof admin) {
  return { ...source };
}
```

### 함수 타입 추출

```typescript
function createAdmin(name: string, email: string) {
  return { id: Date.now().toString(), name, email };
}

type CreateAdminFn = typeof createAdmin;
// (name: string, email: string) => { id: string; name: string; email: string }

type AdminResult = ReturnType<typeof createAdmin>;
// { id: string; name: string; email: string }
```

---

## 명시적 타입 vs 추론 — 언제 어떻게?

### 타입 추론을 믿어도 될 때

```typescript
// ✅ 초기값으로 명확히 알 수 있을 때
const name = "홍길동";    // string 명확
const count = 0;          // number 명확
const arr = [1, 2, 3];   // number[] 명확

// ✅ 함수가 단순할 때
function double(n: number) {
  return n * 2;  // 반환 타입 number 자동 추론
}

// ✅ 제네릭 인수 추론
const result = first(["a", "b"]);  // T = string으로 추론
```

### 타입을 명시하는 것이 좋을 때

```typescript
// ✅ 빈 컨테이너
const items: AdminDto[] = [];
const cache: Map<string, AdminDto> = new Map();

// ✅ 함수의 공개 API
// (외부에서 보는 사람이 반환 타입을 명확히 알 수 있게)
async findAll(): Promise<Admin[]> {
  return await this.prisma.admin.findMany({});
}

// ✅ 복잡한 로직의 중간 변수 (가독성)
const filteredAdmins: AdminDto[] = admins.filter(a => a.role === '관리자');

// ✅ null/undefined가 포함될 때
let currentUser: AdminDto | null = null;
```

---

## `satisfies` 연산자 (TypeScript 4.9+)

타입 추론은 유지하면서 타입 검사도 받고 싶을 때 사용해요.

```typescript
type Config = {
  port: number;
  host: string;
};

// as를 쓰면 타입 좁혀짐 (port가 number가 됨)
const config = { port: 3000, host: "localhost" } as Config;
config.port;  // number — 3000이라는 정확한 값 정보 잃음

// satisfies를 쓰면 타입 검사 + 추론 유지
const config = { port: 3000, host: "localhost" } satisfies Config;
config.port;  // 3000 — 정확한 값 유지!

// Config에 맞지 않으면 에러
const wrongConfig = { port: "3000", host: "localhost" } satisfies Config;
// ← 에러! port는 string이 아닌 number여야 함
```

---

## 정리

```
타입 추론 = TypeScript가 값을 보고 타입을 자동 파악

const → 리터럴 타입 (정확한 값)
let   → 넓은 타입 (변경 가능성 반영)

빈 배열      → 타입 명시 필요 (string[] = [])
함수 반환값  → 대부분 추론 가능, API는 명시 권장
복잡한 경우  → typeof 로 타입 추출 가능

typeof value    → 값의 타입
as const        → 리터럴 타입으로 고정
satisfies Type  → 타입 검사 + 추론 유지 (4.9+)
```
