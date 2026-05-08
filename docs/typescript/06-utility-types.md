# 유틸리티 타입 — TypeScript 내장 변환 도구들

---

## 유틸리티 타입이란?

TypeScript가 기본으로 제공하는 **타입 변환 도구**들이에요.

기존 타입을 기반으로 새 타입을 만들 때 사용해요. 직접 타입을 일일이 다시 정의하지 않아도 돼요.

```typescript
// AdminDto를 기반으로 다양한 변형 타입을 만들 수 있어요
type AdminDto = {
  id: string;
  name: string;
  email: string;
  role: '관리자' | '최고관리자';
  password: string;
};
```

이 `AdminDto`를 기반으로 여러 유틸리티 타입을 살펴볼게요.

---

## 1. `Partial<T>` — 모든 속성을 선택적으로

"이 타입의 모든 필드를 있어도 되고 없어도 되게"

```typescript
type PartialAdmin = Partial<AdminDto>;
// 결과:
// {
//   id?: string;
//   name?: string;
//   email?: string;
//   role?: '관리자' | '최고관리자';
//   password?: string;
// }

// 관리자 정보 수정 시 일부 필드만 전달 (PATCH 요청)
function updateAdmin(id: string, updates: Partial<AdminDto>) {
  // updates에는 name만 있어도 OK, email만 있어도 OK
}

updateAdmin("uuid-1", { name: "새이름" });       // OK
updateAdmin("uuid-1", { email: "new@test.com" }); // OK
updateAdmin("uuid-1", {});                         // OK (빈 객체도 허용)
```

---

## 2. `Required<T>` — 모든 속성을 필수로

`Partial`의 반대예요. 선택적 필드를 모두 필수로 만들어요.

```typescript
interface AdminConfig {
  name?: string;
  email?: string;
  role?: string;
}

type RequiredConfig = Required<AdminConfig>;
// {
//   name: string;   // ? 사라짐
//   email: string;  // ? 사라짐
//   role: string;   // ? 사라짐
// }

// 설정이 완전히 채워진 상태가 필요할 때
function applyConfig(config: RequiredConfig) {
  // 모든 필드가 반드시 있음을 보장
}
```

---

## 3. `Readonly<T>` — 모든 속성을 읽기 전용으로

"한 번 만들면 수정 불가"

```typescript
type ReadonlyAdmin = Readonly<AdminDto>;
// {
//   readonly id: string;
//   readonly name: string;
//   readonly email: string;
//   ...
// }

const admin: ReadonlyAdmin = {
  id: "uuid-1",
  name: "홍길동",
  email: "admin@test.com",
  role: "관리자",
  password: "hashed...",
};

admin.name = "김철수";  // ← 에러! readonly라서 수정 불가
```

---

## 4. `Pick<T, K>` — 특정 속성만 골라내기

"이 타입에서 이것들만 뽑아서 새 타입 만들기"

```typescript
// AdminDto에서 id, name, email만 선택
type AdminPreview = Pick<AdminDto, 'id' | 'name' | 'email'>;
// {
//   id: string;
//   name: string;
//   email: string;
// }

// 목록 조회 시 최소한의 정보만 반환할 때
function getAdminList(): AdminPreview[] {
  // 비밀번호 같은 민감한 정보 제외
}
```

---

## 5. `Omit<T, K>` — 특정 속성만 제외하기

`Pick`의 반대예요. "이것들만 빼고 나머지로 새 타입 만들기"

```typescript
// AdminDto에서 password만 제외
type AdminWithoutPassword = Omit<AdminDto, 'password'>;
// {
//   id: string;
//   name: string;
//   email: string;
//   role: '관리자' | '최고관리자';
// }

// 이 프로젝트에서 AdminDTO (클래스)가 하는 역할을 타입으로 표현하면:
type PublicAdminDto = Omit<AdminDto, 'password'>;
// password는 절대 외부에 노출하면 안 됨
```

---

## 6. `Record<K, V>` — 키-값 맵 타입

"K 타입의 키, V 타입의 값을 가진 객체"

```typescript
// string 키, AdminDto 값
type AdminMap = Record<string, AdminDto>;

const adminsById: AdminMap = {
  "uuid-1": { id: "uuid-1", name: "홍길동", ... },
  "uuid-2": { id: "uuid-2", name: "김철수", ... },
};

// 역할별 관리자 수
type RoleCount = Record<'관리자' | '최고관리자', number>;
const counts: RoleCount = {
  "관리자": 5,
  "최고관리자": 1,
};

// 에러 코드 매핑
type ErrorMessages = Record<string, string>;
const errors: ErrorMessages = {
  "P2002": "이미 존재하는 값입니다",
  "P2025": "데이터를 찾을 수 없습니다",
};
```

---

## 7. `Exclude<T, U>` — 유니온에서 특정 타입 제거

"T 유니온에서 U에 해당하는 것들을 제거"

```typescript
type Role = '관리자' | '최고관리자' | '게스트';

// '게스트' 제거
type ActiveRole = Exclude<Role, '게스트'>;
// '관리자' | '최고관리자'

type StringOrNull = string | null | undefined;
// null과 undefined 제거
type JustString = Exclude<StringOrNull, null | undefined>;
// string
```

---

## 8. `Extract<T, U>` — 유니온에서 특정 타입만 추출

`Exclude`의 반대예요.

```typescript
type MixedType = string | number | boolean | null;

// string이나 number만 추출
type Primitive = Extract<MixedType, string | number>;
// string | number

type EventNames = 'click' | 'hover' | 'keydown' | 'keyup';
// key 관련만 추출
type KeyEvents = Extract<EventNames, `key${string}`>;
// 'keydown' | 'keyup'
```

---

## 9. `NonNullable<T>` — null/undefined 제거

```typescript
type MaybeString = string | null | undefined;

type DefinitelyString = NonNullable<MaybeString>;
// string

// 실제 사용
type SafeEmail = NonNullable<AdminDto['email']>;
// string (null/undefined 제거된 string)
```

---

## 10. `ReturnType<T>` — 함수의 반환 타입 추출

```typescript
// 함수의 반환 타입을 자동으로 가져와요
function getAdmin() {
  return {
    id: "uuid-1",
    name: "홍길동",
    email: "admin@test.com",
  };
}

type AdminFromFunction = ReturnType<typeof getAdmin>;
// { id: string; name: string; email: string }

// async 함수의 경우
async function fetchAdmin(): Promise<AdminDto> {
  // ...
}

type FetchResult = ReturnType<typeof fetchAdmin>;
// Promise<AdminDto>

type FetchData = Awaited<ReturnType<typeof fetchAdmin>>;
// AdminDto (Promise 벗겨냄)
```

---

## 11. `Parameters<T>` — 함수의 매개변수 타입 추출

```typescript
function signIn(email: string, password: string): boolean {
  return true;
}

type SignInParams = Parameters<typeof signIn>;
// [email: string, password: string]
// (튜플 타입)

// 첫 번째 매개변수만
type EmailParam = Parameters<typeof signIn>[0];
// string
```

---

## 12. `Awaited<T>` — Promise 안의 타입 꺼내기

```typescript
type P = Promise<AdminDto>;
type Unwrapped = Awaited<P>;
// AdminDto

// 중첩된 Promise도 처리
type Nested = Promise<Promise<string>>;
type Inner = Awaited<Nested>;
// string
```

---

## 이 프로젝트에서 실제 조합 예

```typescript
// 1. 생성 DTO — id, createdAt 같은 자동 생성 필드 제외
type CreateAdminInput = Omit<AdminDto, 'id' | 'createdAt' | 'updatedAt'>;

// 2. 수정 DTO — 모든 필드 선택적 (일부만 수정 가능)
type UpdateAdminInput = Partial<Omit<AdminDto, 'id' | 'password'>>;

// 3. 공개 응답 — 비밀번호 제외
type PublicAdmin = Omit<AdminDto, 'password'>;

// 4. 읽기 전용 상태
type FrozenAdmin = Readonly<AdminDto>;
```

---

## 유틸리티 타입 빠른 참조표

| 유틸리티 타입 | 설명 | 예시 |
|--------------|------|------|
| `Partial<T>` | 모든 속성 선택적 | `Partial<AdminDto>` |
| `Required<T>` | 모든 속성 필수 | `Required<Config>` |
| `Readonly<T>` | 모든 속성 읽기 전용 | `Readonly<AdminDto>` |
| `Pick<T, K>` | K 속성만 선택 | `Pick<AdminDto, 'id' \| 'name'>` |
| `Omit<T, K>` | K 속성만 제외 | `Omit<AdminDto, 'password'>` |
| `Record<K, V>` | 키-값 맵 | `Record<string, number>` |
| `Exclude<T, U>` | 유니온에서 U 제거 | `Exclude<Role, 'guest'>` |
| `Extract<T, U>` | 유니온에서 U만 추출 | `Extract<Role, 'admin'>` |
| `NonNullable<T>` | null/undefined 제거 | `NonNullable<string \| null>` |
| `ReturnType<T>` | 함수 반환 타입 | `ReturnType<typeof fn>` |
| `Parameters<T>` | 함수 매개변수 타입 | `Parameters<typeof fn>` |
| `Awaited<T>` | Promise 벗겨내기 | `Awaited<Promise<string>>` |
