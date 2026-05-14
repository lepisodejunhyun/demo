# 제네릭(Generics) — "타입도 매개변수로 받을 수 있어요"

---

## 왜 제네릭이 필요한가?

같은 로직인데 타입만 다른 함수를 여러 개 만들어야 할 때 제네릭이 필요해요.

```typescript
// string 배열의 첫 번째 요소를 반환
function firstString(arr: string[]): string {
  return arr[0];
}

// number 배열의 첫 번째 요소를 반환
function firstNumber(arr: number[]): number {
  return arr[0];
}

// 같은 로직인데 타입만 달라요! 중복이에요.
```

`any`를 쓰면 타입 안전성이 없어지고, 같은 함수를 반복 작성하면 중복이 생겨요.

제네릭은 이 문제를 해결해요 — **타입 자체를 매개변수로 받는 것**이에요.

---

## 기본 문법

```typescript
// <T>는 타입 매개변수 — 나중에 호출할 때 정해져요
function first<T>(arr: T[]): T {
  return arr[0];
}

// 호출 시 타입이 결정됨
const name = first<string>(["홍길동", "김철수"]);   // T = string
const score = first<number>([90, 85, 70]);         // T = number
const flag = first<boolean>([true, false]);          // T = boolean

// TypeScript가 타입을 추론할 수 있으면 생략도 가능
const name2 = first(["홍길동", "김철수"]);  // T = string으로 자동 추론
```

`T`는 관례적으로 쓰는 이름이에요. "Type"의 약자예요. `T`, `U`, `V` 또는 `Item`, `Value` 같은 의미 있는 이름도 사용할 수 있어요.

---

## 제네릭 함수

### 여러 타입 매개변수

```typescript
// 두 값을 받아서 객체로 묶기
function pair<K, V>(key: K, value: V): { key: K; value: V } {
  return { key, value };
}

const result = pair("name", "홍길동");
// result: { key: string; value: string }

const result2 = pair("age", 25);
// result2: { key: string; value: number }
```

### 배열 관련 유틸리티

```typescript
// 배열에서 특정 값 찾기
function findItem<T>(arr: T[], predicate: (item: T) => boolean): T | undefined {
  return arr.find(predicate);
}

const admins = [
  { id: "1", name: "홍길동" },
  { id: "2", name: "김철수" },
];

const admin = findItem(admins, (a) => a.name === "홍길동");
// admin: { id: string; name: string } | undefined
```

---

## 제네릭 인터페이스와 타입

### API 응답 래퍼

```typescript
// 이 프로젝트의 실제 패턴
type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

// 사용할 때 T에 실제 타입을 넣어요
type AdminResponse = ApiResponse<AdminDto>;
// { success: boolean; data: AdminDto; message: string }

type AdminListResponse = ApiResponse<AdminDto[]>;
// { success: boolean; data: AdminDto[]; message: string }
```

### 페이지네이션 패턴

```typescript
type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// AdminDto 목록의 페이지 결과
type AdminPage = PaginatedResult<AdminDto>;
```

### 상태 관리 패턴

```typescript
// Angular Signal 상태 패턴
type StoreState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

// AdminStore의 상태
type AdminState = StoreState<AdminDto>;
// { data: AdminDto | null; loading: boolean; error: string | null }
```

---

## 제네릭 클래스

```typescript
// 어떤 타입이든 저장할 수 있는 저장소 클래스
class Store<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  getAll(): T[] {
    return this.items;
  }

  findById(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }
}

// string을 저장하는 Store
const nameStore = new Store<string>();
nameStore.add("홍길동");
nameStore.add("김철수");

// AdminDto를 저장하는 Store
const adminStore = new Store<AdminDto>();
adminStore.add({ id: "1", name: "홍길동", email: "..." });
```

---

## 제네릭 제약(Constraints) — `extends`

"T는 반드시 이런 타입이어야 해"라고 제한을 걸 수 있어요.

### 기본 제약

```typescript
// T는 반드시 { id: string } 형태여야 해
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

const admins = [{ id: "1", name: "홍길동" }];
const admin = findById(admins, "1");  // OK! id가 있으니까

const numbers = [1, 2, 3];
findById(numbers, "1");  // ← 에러! number에는 id가 없음
```

### 키 제약 — `keyof`

```typescript
// obj의 키 중 하나만 받을 수 있어요
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const admin = { id: "1", name: "홍길동", email: "admin@test.com" };

const name = getProperty(admin, "name");   // OK → string
const id = getProperty(admin, "id");       // OK → string
const age = getProperty(admin, "age");     // ← 에러! admin에 age 없음
```

---

## 이 프로젝트에서 실제 사용 예

### `Promise<T>` — 비동기 반환 타입

```typescript
// NestJS 서비스 메서드
async findAll(): Promise<Admin[]> {
  return await this.prisma.admin.findMany({});
}

// Promise<T>는 TypeScript 내장 제네릭
// T = Admin[] → 나중에 Admin[] 배열을 돌려줄 것을 약속
```

### `ThrowOnError` 제네릭 — `sdk.gen.ts`

```typescript
// @hey-api/openapi-ts가 생성한 함수
export function adminControllerSignin<ThrowOnError extends boolean = false>(
  options: Options<AdminSigninData, ThrowOnError>
) {
  // ThrowOnError가 true면 에러 시 throw
  // ThrowOnError가 false면 에러 응답 반환
}
```

### `signal<T>()` — Angular 시그널

```typescript
// admin.store.ts
// AdminDto | null 타입의 Signal
readonly user = signal<AdminDto | null>(null);

// TypeScript가 타입을 추론하므로 생략 가능
// signal(null)이면 null만 담을 수 있어서 명시 필요
```

### `plainToInstance<T>` — class-transformer

```typescript
// admin.controller.ts
const result = plainToInstance(AdminDTO, admins);
// 내부적으로 AdminDTO를 T로 사용
// plainToInstance<AdminDTO, object>(AdminDTO, admins) 와 동일
```

---

## 제네릭 유틸리티 타입 미리보기

TypeScript 내장 제네릭 타입들이 있어요 (다음 문서에서 자세히):

```typescript
// Array<T> — T 타입의 배열
type AdminList = Array<AdminDto>;

// Promise<T> — 나중에 T를 반환
type AsyncAdmin = Promise<AdminDto>;

// Partial<T> — T의 모든 속성을 선택적으로
type PartialAdmin = Partial<AdminDto>;

// Required<T> — T의 모든 속성을 필수로
type RequiredAdmin = Required<AdminDto>;

// Record<K, V> — 키 K, 값 V인 객체
type AdminMap = Record<string, AdminDto>;
```

---

## 정리

```
제네릭 = 타입을 매개변수로 받는 것

function f<T>(x: T): T   → T는 호출 시 결정
interface I<T> { x: T }  → T는 사용 시 결정
class C<T> { ... }       → T는 인스턴스 생성 시 결정

<T extends SomeType>     → T는 SomeType을 만족해야 함
<K extends keyof T>      → K는 T의 키 중 하나여야 함
```

제네릭 덕분에 코드를 한 번 작성하고 다양한 타입에 재사용할 수 있어요. `Promise<T>`, `Array<T>`, `signal<T>()` 등 여러분이 이미 쓰고 있는 것들이 모두 제네릭이에요!
