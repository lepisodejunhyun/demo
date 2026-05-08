# Union 타입 — "이것 또는 저것"

---

## Union 타입이란?

`|` (파이프) 기호로 여러 타입을 연결하면 "이 타입들 중 하나"라는 의미예요.

```typescript
// "string 또는 number"
let value: string | number;

value = "hello";  // OK (string)
value = 42;       // OK (number)
value = true;     // ← 에러! boolean은 포함 안 됨
```

마치 메뉴판처럼 생각하면 돼요. "짜장면 | 짬뽕 | 볶음밥" → 이 세 가지 중 하나만 고를 수 있어요.

---

## 기본 사용법

### 타입과 타입 연결

```typescript
// string 또는 null
let email: string | null = null;
email = "admin@test.com";  // OK
email = null;              // OK

// string 또는 number 또는 boolean
let flexible: string | number | boolean;
flexible = "hello";
flexible = 42;
flexible = true;
```

### 특정 값(리터럴)만 허용

```typescript
// 딱 이 두 문자열만 허용
type Direction = 'left' | 'right' | 'up' | 'down';

let move: Direction = 'left';    // OK
let move2: Direction = 'right';  // OK
let move3: Direction = 'diagonal';  // ← 에러! 없는 값
```

---

## 이 프로젝트에서 실제 사용 예

### `AdminRole` 유니온 타입

```typescript
// libs/api-client/src/types.gen.ts (자동 생성)
export type AdminDto = {
  role: '관리자' | '최고관리자';  // 딱 이 두 값만 가능
};
```

서버에서 Prisma enum으로 정의한 값이 클라이언트에서 유니온 타입으로 자동 변환돼요.

### Nullable 필드

```typescript
// 이 프로젝트 곳곳에서 사용
export type AdminDto = {
  lastLoginAt?: string | null;   // string 또는 null
  deletedAt?: string | null;     // string 또는 null
  lockedUntil: string;           // 반드시 string (null 불가)
};
```

### `string | null` vs `string | undefined` vs `string | null | undefined`

```typescript
let a: string | null;       // null은 가능, undefined는 불가
let b: string | undefined;  // undefined는 가능, null은 불가
let c: string | null | undefined;  // 둘 다 가능

// 실무에서는 주로
// DB 필드 → string | null  (DB는 NULL을 사용)
// 함수 매개변수 → string | undefined  (안 넘겨도 되는 값)
```

---

## Union 타입 사용 시 주의점

### 공통 속성만 접근 가능

```typescript
type Cat = { name: string; meow(): void };
type Dog = { name: string; bark(): void };

type Animal = Cat | Dog;

function greet(animal: Animal) {
  console.log(animal.name);   // OK! 둘 다 name이 있음
  animal.meow();              // ← 에러! Dog에는 meow가 없을 수 있음
  animal.bark();              // ← 에러! Cat에는 bark가 없을 수 있음
}
```

TypeScript는 "둘 중 어느 것인지 모르는 상태"에서 공통된 것만 사용하게 해요.

### 타입을 구분해서 사용하려면 타입 가드가 필요

```typescript
function makeSound(animal: Cat | Dog) {
  if ('meow' in animal) {
    // 여기서는 animal이 Cat임을 TypeScript가 앎
    animal.meow();
  } else {
    // 여기서는 animal이 Dog임을 TypeScript가 앎
    animal.bark();
  }
}
```

(타입 가드 자세한 내용은 [07-type-guard.md](./07-type-guard.md) 참고)

---

## 실용적인 Union 타입 패턴

### API 응답 처리

```typescript
type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleResult(result: ApiResult<AdminDto>) {
  if (result.success) {
    console.log(result.data.name);   // OK
  } else {
    console.log(result.error);       // OK
  }
}
```

### 로딩 상태 표현

```typescript
type LoadingState<T> = 'loading' | 'error' | T;

let adminData: LoadingState<AdminDto> = 'loading';
adminData = 'error';
adminData = { id: "...", name: "..." };  // AdminDto로 교체
```

### 함수 오버로드 대신 사용

```typescript
// string이나 number를 받아서 항상 string으로 반환
function toString(value: string | number): string {
  if (typeof value === 'string') return value;
  return value.toString();
}
```

---

## Union vs Any

```typescript
// any: 모든 타입 허용, 타입 안전성 없음
let a: any = "hello";
a.toFixed(2);  // 에러 없음 (실행 중에 터짐)

// union: 지정한 타입만 허용, 타입 안전성 있음
let b: string | number = "hello";
b.toFixed(2);  // ← 컴파일 에러! string에는 toFixed 없음
               // 타입을 확인 후 사용해야 함
```

Union 타입은 유연함과 안전함을 동시에 제공해요. `any`보다 훨씬 좋아요.

---

## 정리

```
string | number  → string이거나 number
string | null    → string이거나 null (Nullable)
'a' | 'b' | 'c' → 딱 이 세 값 중 하나 (리터럴 유니온)
A | B            → A 타입이거나 B 타입 (객체 유니온)
```

이 프로젝트에서 `| null`, `| undefined`, 그리고 `'관리자' | '최고관리자'` 같은 리터럴 유니온을 자주 만나게 될 거예요.
