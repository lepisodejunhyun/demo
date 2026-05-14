# 기본 타입 — TypeScript의 모든 타입 종류

---

## TypeScript가 왜 필요한가?

JavaScript는 타입이 없어요. 아무 값이나 어디든 넣을 수 있어요.

```javascript
// JavaScript (타입 없음)
let name = "홍길동";
name = 123;        // 숫자를 넣어도 에러 없음
name = true;       // 불리언을 넣어도 에러 없음
name = null;       // null을 넣어도 에러 없음

// 실수가 프로그램 실행 중에야 발견됨
function greet(name) {
  return name.toUpperCase();  // name이 숫자면 실행 중 에러 발생!
}
greet(123);  // 실행해봐야 에러가 남
```

TypeScript는 타입을 미리 정해서 **실행 전에 실수를 잡아줘요**.

```typescript
// TypeScript (타입 있음)
let name: string = "홍길동";
name = 123;  // ← 컴파일 에러! string에 number 넣을 수 없음
             //   실행하기 전에 바로 알 수 있음

function greet(name: string) {
  return name.toUpperCase();
}
greet(123);  // ← 컴파일 에러! string을 기대하는데 number를 넣음
```

---

## 1. `string` — 문자열

```typescript
let name: string = "홍길동";
let email: string = 'admin@test.com';
let greeting: string = `안녕하세요, ${name}님`;  // 템플릿 리터럴도 OK

// 이 프로젝트에서 실제 사용 예
const id: string = "550e8400-e29b-41d4-a716-446655440000";  // UUID
const email: string = "admin@test.com";
```

---

## 2. `number` — 숫자

```typescript
let age: number = 25;
let price: number = 9.99;       // 소수도 number
let failCount: number = 0;
let hex: number = 0xff;         // 16진수도 number

// 이 프로젝트에서 실제 사용 예
failCount: number;  // Admin 모델의 로그인 실패 횟수
```

---

## 3. `boolean` — 참/거짓

```typescript
let isLoggedIn: boolean = false;
let isValid: boolean = true;

// 이 프로젝트에서 실제 사용 예
const isPasswordValid = compareSync(password, admin.password);
// compareSync는 boolean을 반환 → true(맞음) / false(틀림)
```

---

## 4. `null` — 값이 없음 (의도적으로 비어있음)

```typescript
let deletedAt: Date | null = null;  // 삭제 안 됐으면 null
```

`null`은 "값이 없다"는 것을 **의도적으로** 표현해요.

이 프로젝트에서 `deletedAt`, `lastLoginAt`, `lockedUntil` 같은 선택적 날짜 필드에 쓰여요.

---

## 5. `undefined` — 아직 값이 할당되지 않음

```typescript
let value: string | undefined;
console.log(value);  // undefined (아직 할당 안 됨)
```

`null`과 `undefined`의 차이:
```
null       → 개발자가 "값 없음"을 의도적으로 지정
undefined  → 아직 값을 넣지 않은 상태 (자동)
```

---

## 6. `any` — 모든 타입 허용 (사용 주의!)

```typescript
let anything: any = "문자열";
anything = 123;     // OK
anything = true;    // OK
anything = null;    // OK
anything = {};      // OK
```

`any`를 쓰면 TypeScript의 타입 검사를 완전히 끄는 것과 같아요.

**언제 써야 하냐?**
- 외부 라이브러리 타입이 없을 때
- 빠른 프로토타이핑 중에 임시로

**문제점:**
```typescript
let data: any = "hello";
data.toFixed(2);  // 에러 없음 (string에 toFixed가 없는데도!)
                  // 실행 중에 에러 발생
```

가능하면 `any` 대신 `unknown`을 써요.

---

## 7. `unknown` — 알 수 없는 타입 (any보다 안전)

```typescript
let data: unknown = "hello";

// any와 달리 unknown은 사용 전에 타입 확인이 필요해요
data.toUpperCase();  // ← 에러! unknown 타입은 바로 사용 불가

// 타입 확인 후 사용 가능
if (typeof data === 'string') {
  data.toUpperCase();  // OK! string으로 확인됨
}
```

`unknown`은 에러 처리에서 자주 써요:

```typescript
// 이 프로젝트에서 실제 사용 예
try {
  await prisma.admin.create({ data });
} catch (error: unknown) {  // catch의 error는 unknown 타입
  if (error instanceof PrismaClientKnownRequestError) {
    // instanceof로 타입 확인 후 사용
    console.log(error.code);
  }
}
```

---

## 8. `never` — 절대 발생할 수 없는 타입

함수가 **절대 값을 반환하지 않을 때** 사용해요.

```typescript
// 항상 에러를 던지는 함수
function throwError(message: string): never {
  throw new Error(message);
  // return이 없음 — 절대 정상 종료 안 됨
}

// 무한 루프
function infiniteLoop(): never {
  while (true) {}
}
```

실무에서 `never`를 직접 쓸 일은 드물지만, TypeScript가 내부적으로 많이 사용해요.

---

## 9. `void` — 반환값이 없는 함수

함수가 값을 **반환하지 않을 때** 사용해요.

```typescript
function logMessage(message: string): void {
  console.log(message);
  // return이 없음 (또는 return;)
}

// 이 프로젝트에서 실제 사용 예 (admin.store.ts)
setUser(user: AdminDto): void {
  this.state.update(s => ({ ...s, user }));
  // 반환값 없음
}

clearUser(): void {
  this.state.update(s => ({ ...s, user: null }));
  // 반환값 없음
}
```

`void` vs `never`:
```
void  → 함수가 실행을 마치고 종료됨, 단지 반환값이 없을 뿐
never → 함수가 절대 정상 종료되지 않음 (에러 throw, 무한 루프)
```

---

## 10. `array` — 배열 타입

```typescript
// 방법 1: 타입[]
let names: string[] = ["홍길동", "김철수"];
let ids: number[] = [1, 2, 3];
let flags: boolean[] = [true, false, true];

// 방법 2: Array<타입>
let names: Array<string> = ["홍길동", "김철수"];

// 이 프로젝트에서 실제 사용 예
async findAll(): Promise<Admin[]> {  // Admin 배열
  return await this.prisma.admin.findMany({});
}
```

---

## 11. `tuple` — 고정 길이 배열 (각 위치의 타입이 정해짐)

```typescript
// 첫 번째는 string, 두 번째는 number
let person: [string, number] = ["홍길동", 25];

person[0];  // string
person[1];  // number
person[2];  // 에러! 2번 인덱스는 없음

// 실제 사용 예 (React useState와 비슷한 패턴)
const [name, setName]: [string, (v: string) => void] = useState("");
```

---

## 12. `object` — 객체 타입

```typescript
// 명시적 객체 타입
let admin: { id: string; name: string; email: string } = {
  id: "uuid-123",
  name: "홍길동",
  email: "admin@test.com",
};

// 보통은 interface나 type으로 정의 (다음 문서 참고)
```

---

## 13. 타입 선언 방법

### 변수에 타입 붙이기

```typescript
// 변수: 타입 = 값
let name: string = "홍길동";
const count: number = 0;
```

### 함수 매개변수와 반환값

```typescript
// function 함수명(매개변수: 타입): 반환타입
function add(a: number, b: number): number {
  return a + b;
}

// 화살표 함수
const add = (a: number, b: number): number => a + b;

// 반환값이 없을 때
function log(message: string): void {
  console.log(message);
}
```

### 비동기 함수

```typescript
// async 함수의 반환 타입은 Promise<실제반환타입>
async function findAdmin(id: string): Promise<Admin> {
  return await prisma.admin.findFirst({ where: { id } });
}

// 이 프로젝트에서 실제 사용 예
async findAll(): Promise<Admin[]> {
  const admins = await this.prisma.admin.findMany({});
  return admins;
}

async signIn(data: AdminSignInDTO): Promise<Admin> {
  // ...
}
```

---

## 타입 빠른 참조표

| 타입 | 값 예시 | 설명 |
|------|---------|------|
| `string` | `"hello"`, `'world'` | 문자열 |
| `number` | `42`, `3.14`, `-1` | 숫자 (정수, 소수 구분 없음) |
| `boolean` | `true`, `false` | 참/거짓 |
| `null` | `null` | 의도적으로 값 없음 |
| `undefined` | `undefined` | 아직 값 없음 |
| `any` | 뭐든 | 타입 검사 끔 (사용 주의) |
| `unknown` | 뭐든 | 타입 검사 켜짐 (사용 전 확인 필요) |
| `never` | (없음) | 절대 발생 안 하는 타입 |
| `void` | (없음) | 반환값 없는 함수 |
| `string[]` | `["a", "b"]` | 문자열 배열 |
| `[string, number]` | `["a", 1]` | 고정 타입 배열 |
