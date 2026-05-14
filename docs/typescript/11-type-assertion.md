# 타입 단언(Type Assertion) — "내가 이 타입을 더 잘 알아"

---

## 타입 단언이란?

TypeScript가 추론한 타입보다 내가 더 정확히 알고 있을 때, "이 값의 타입은 이거야"라고 직접 알려주는 거예요.

`as` 키워드를 사용해요.

```typescript
// TypeScript는 이 값이 string | number라고 알고 있어요
const value: string | number = "hello";

// 하지만 나는 string인 걸 확실히 알아요
const str = value as string;
str.toUpperCase();  // OK! TypeScript가 string으로 인정
```

---

## 기본 문법

### `as` 문법 (권장)

```typescript
const element = document.getElementById('input') as HTMLInputElement;
element.value = "hello";  // HTMLInputElement에는 value가 있음
```

### `<타입>` 문법 (구형, JSX에서 사용 불가)

```typescript
// 같은 의미지만 React/Angular 템플릿에서는 사용 불가
const element = <HTMLInputElement>document.getElementById('input');
```

`as` 문법을 사용하는 것을 권장해요.

---

## 타입 단언이 필요한 상황들

### DOM 요소 타입

```typescript
// getElementById는 HTMLElement | null을 반환해요
const input = document.getElementById('email');
// input: HTMLElement | null

// HTMLInputElement에는 value 속성이 있지만
// HTMLElement에는 없어서 에러가 나요
input.value;  // ← 에러! HTMLElement에는 value 없음

// 타입 단언으로 해결
const input = document.getElementById('email') as HTMLInputElement;
input.value;  // OK!

// 또는 null 체크와 함께
const input = document.getElementById('email');
if (input instanceof HTMLInputElement) {
  input.value;  // 타입 가드로 해결 (더 안전한 방법)
}
```

### `unknown` 타입 다루기

```typescript
// try-catch의 error는 unknown 타입
try {
  await someOperation();
} catch (error: unknown) {
  // unknown 타입이라 바로 접근 불가
  error.message;  // ← 에러!

  // 타입 단언으로 해결 (비권장)
  const err = error as Error;
  err.message;  // OK (하지만 실제로 Error가 아닐 수 있어요!)

  // instanceof 타입 가드로 해결 (권장)
  if (error instanceof Error) {
    error.message;  // 안전!
  }
}
```

### JSON 파싱 결과

```typescript
const data = JSON.parse(response);
// data: any  (any는 타입 검사가 없음)

// any는 어디든 사용 가능하지만, 타입 정보가 없어요
// 타입 단언으로 타입 정보를 부여
const admin = JSON.parse(response) as AdminDto;
admin.name;  // TypeScript가 AdminDto 기준으로 검사
```

---

## Non-null 단언 `!`

"이 값은 null이나 undefined가 절대 아니야"라는 특별한 단언이에요.

```typescript
// TypeScript: admin은 Admin | null 타입이에요
const admin = await prisma.admin.findFirst({ where: { id } });

// !를 붙이면 null이 아님을 단언
admin!.name;     // TypeScript가 null 체크를 요구하지 않음

// 이 프로젝트에서 실제 사용 예
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  // DATABASE_URL이 없으면 서버 시작 자체가 안 되므로
  // 이 시점에서는 반드시 있다고 보장할 수 있음
});
```

자세한 내용은 [04-optional-assertion.md](./04-optional-assertion.md)를 참고하세요.

---

## `as const` — 리터럴 타입으로 고정

값을 변경 불가능한 리터럴 타입으로 만들어요.

```typescript
// 일반 선언 — TypeScript가 넓은 타입으로 추론
const role = '관리자';         // 타입: string
const config = { port: 3000 }; // 타입: { port: number }

// as const — 좁은 리터럴 타입으로 고정
const role = '관리자' as const;         // 타입: '관리자' (정확한 값)
const config = { port: 3000 } as const; // 타입: { readonly port: 3000 }
```

### 배열에 `as const`

```typescript
// 일반 배열 — string[] 타입
const roles = ['관리자', '최고관리자'];
// roles: string[]

// as const — 리터럴 튜플 타입
const roles = ['관리자', '최고관리자'] as const;
// roles: readonly ['관리자', '최고관리자']

// typeof로 유니온 타입 추출
type AdminRole = typeof roles[number];
// '관리자' | '최고관리자'
```

### 객체에 `as const`

```typescript
const ERROR_CODES = {
  NOT_FOUND: 'P2025',
  DUPLICATE: 'P2002',
} as const;

// ERROR_CODES.NOT_FOUND 타입: 'P2025' (string이 아닌 정확한 값)
// ERROR_CODES.DUPLICATE 타입: 'P2002'
// 수정도 불가: ERROR_CODES.NOT_FOUND = '...'  ← 에러!

type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
// 'P2025' | 'P2002'
```

---

## 이중 단언 (Double Assertion)

타입이 너무 달라서 직접 단언이 안 될 때 `unknown`을 거쳐서 단언해요.

```typescript
// string을 number로 직접 단언 — 불가
const str = "hello" as number;  // ← 에러!

// unknown을 거치면 가능 (하지만 위험해요!)
const str = "hello" as unknown as number;  // 컴파일 통과 (런타임에 문제 가능)
```

이중 단언은 정말 특별한 경우가 아니면 사용하지 않는 게 좋아요. 타입 시스템을 완전히 우회하는 것이라 런타임 에러의 원인이 돼요.

---

## 타입 단언 vs 타입 변환

타입 단언은 **타입 정보만** 바꾸는 거예요. 실제 값을 변환하지 않아요.

```typescript
const num = 42;
const str = num as unknown as string;  // 타입 단언 (값은 여전히 42)

console.log(typeof str);  // "number" — 값은 여전히 숫자!
str.toUpperCase();        // 런타임 에러! 실제 값은 string이 아님

// 실제 타입 변환이 필요하면 변환 함수를 사용해야 해요
const actualStr = String(num);  // 진짜 string으로 변환
actualStr.toUpperCase();        // OK!
```

---

## 안전한 단언 vs 위험한 단언

```typescript
// ✅ 안전한 사용 — 실제로 해당 타입임을 알 때
const btn = document.querySelector('#submit') as HTMLButtonElement;
// querySelector는 Element | null을 반환하지만
// 우리는 이게 버튼임을 확실히 알고 있음

// ✅ 안전한 사용 — 타입 좁히기 후 단언
function process(value: string | number) {
  if (typeof value === 'string') {
    const str = value; // 이미 string으로 좁혀짐, 단언 불필요
  }
}

// ❌ 위험한 사용 — 확인 없이 단언
const admin = await prisma.admin.findFirst({ where: { id } });
const name = (admin as Admin).name;
// admin이 null이면 런타임 에러 발생!

// ✅ 더 나은 방법 — null 체크 후 사용
if (admin) {
  const name = admin.name;  // null 제거됨, 단언 불필요
}
```

---

## 정리

```
as 타입          → 타입 단언 (값은 그대로, 타입 정보만 변경)
!                → Non-null 단언 (null/undefined 아님을 선언)
as const         → 리터럴 타입으로 고정 (readonly + 정확한 값)
as unknown as T  → 이중 단언 (위험, 최후의 수단)

⚠️ 주의: 타입 단언은 TypeScript를 속이는 것
        실제 타입과 다르면 런타임 에러 발생 가능
        가능하면 타입 가드(instanceof, in, typeof)를 먼저 고려
```
