# 옵셔널과 단언 연산자 — `?`, `!`, `?.`, `??`

---

## 왜 이게 필요한가?

프로그래밍에서 값이 없는 경우(`null`, `undefined`)를 다루는 건 매우 흔한 일이에요.

```typescript
const admin = await prisma.admin.findFirst({ where: { id } });
// admin이 null일 수 있어요 (해당 id의 관리자가 없을 수도 있으니까)

console.log(admin.name);  // ← 위험! admin이 null이면 에러 발생!
```

이런 상황을 안전하게 처리하는 4가지 연산자를 알아볼게요.

---

## 1. `?` — 옵셔널 속성 (있어도 되고 없어도 됨)

### 객체 속성에 사용

```typescript
interface Admin {
  id: string;
  name: string;
  lastLoginAt?: Date;   // ? → 이 필드는 없어도 됨
}

// lastLoginAt 없어도 OK
const admin1: Admin = { id: "uuid-1", name: "홍길동" };

// lastLoginAt 있어도 OK
const admin2: Admin = { id: "uuid-2", name: "김철수", lastLoginAt: new Date() };
```

### 함수 매개변수에 사용

```typescript
// options는 안 넘겨도 됨
function findAdmin(id: string, options?: { includeDeleted: boolean }) {
  // options가 있으면 사용, 없으면 기본 동작
}

findAdmin("uuid-123");                        // OK (options 없음)
findAdmin("uuid-123", { includeDeleted: true }); // OK (options 있음)
```

### `?`가 있는 속성의 타입

```typescript
interface Admin {
  lastLoginAt?: Date;
}

// lastLoginAt의 타입은 자동으로 Date | undefined가 됨
// 즉 아래 두 선언은 동일
lastLoginAt?: Date;
lastLoginAt: Date | undefined;
```

---

## 2. `?.` — 옵셔널 체이닝 (안전하게 속성 접근)

값이 `null` 또는 `undefined`일 때 에러 없이 `undefined`를 반환해요.

### 문제 상황

```typescript
const admin = await prisma.admin.findFirst({ where: { id } });
// admin: Admin | null

// admin이 null일 때 에러 발생
console.log(admin.name);        // ← 에러! null.name 접근 불가

// 예전 방식 (번거롭고 길어요)
if (admin !== null && admin !== undefined) {
  console.log(admin.name);
}
```

### `?.` 사용 (안전하고 간결)

```typescript
console.log(admin?.name);
// admin이 null이면 → undefined 반환 (에러 없음)
// admin이 있으면  → admin.name 반환
```

### 체이닝 (연속 사용)

```typescript
const city = user?.address?.city?.name;
// user가 null/undefined → undefined
// user.address가 null/undefined → undefined
// user.address.city가 null/undefined → undefined
// 모두 있으면 → name 반환

// 예전 방식이면 이렇게 길어짐
const city = user && user.address && user.address.city && user.address.city.name;
```

### 메서드 호출에도 사용

```typescript
const upperName = admin?.name?.toUpperCase();
// admin이 없으면 → undefined
// admin.name이 없으면 → undefined
// 둘 다 있으면 → 대문자 이름
```

### 배열 접근에도 사용

```typescript
const firstLog = admin?.loginLogs?.[0];
// admin이 없으면 → undefined
// loginLogs가 없으면 → undefined
// 있으면 → 첫 번째 로그
```

### 이 프로젝트에서 실제 사용 예

```typescript
// Angular 템플릿에서 (admin.store.ts의 user signal 사용)
{{ user()?.name }}
// user()가 null이면 → 아무것도 표시 안 함
// user()가 있으면 → name 표시
```

---

## 3. `??` — Nullish 병합 연산자 (null/undefined일 때 기본값)

값이 `null` 또는 `undefined`일 때 **기본값을 사용**해요.

### 기본 사용법

```typescript
const name = admin?.name ?? '이름 없음';
// admin?.name이 null 또는 undefined → '이름 없음' 사용
// admin?.name이 있으면 → 그 값 사용
```

### `||` 와의 차이점

`||`는 falsy 값(0, '', false, null, undefined)에 모두 반응해요.
`??`는 null과 undefined에만 반응해요.

```typescript
const failCount = admin?.failCount ?? 0;
// admin?.failCount가 0이면 → 0 사용 (0도 유효한 값!)

const failCount = admin?.failCount || 0;
// admin?.failCount가 0이면 → 0은 falsy라서 기본값 0 사용
// 같은 결과처럼 보이지만 의미가 달라요

// 차이가 중요한 경우:
const message = errorMsg ?? '기본 메시지';
// errorMsg가 '' (빈 문자열)이면 → '' 사용 (빈 문자열도 유효)

const message = errorMsg || '기본 메시지';
// errorMsg가 '' (빈 문자열)이면 → '기본 메시지' 사용 (빈 문자열은 falsy)
```

### 이 프로젝트에서 실제 사용 예

```typescript
// main.ts (apps/server/src/main.ts)
const port = process.env.PORT || 3000;
// process.env.PORT가 없으면(falsy) → 3000 사용

// 더 정확하게 쓰려면
const port = process.env.PORT ?? 3000;
// process.env.PORT가 null/undefined일 때만 → 3000 사용
```

---

## 4. `!` — Non-null 단언 연산자 (내가 보장할게!)

"이 값은 절대 null이나 undefined가 아니야"라고 TypeScript에게 말하는 거예요.

```typescript
const admin = await prisma.admin.findFirst({ where: { email } });
// TypeScript: admin은 Admin | null 타입이에요

// !를 붙이면 "null 아님을 내가 보장"
console.log(admin!.name);
// TypeScript가 null 체크를 요구하지 않음
```

### 언제 써야 하나?

**확실히 null이 아님을 알 때만 사용해요.** 잘못 쓰면 런타임 에러가 발생해요.

```typescript
// 좋은 예: 이미 null 체크를 했거나, 로직상 절대 null 불가
const adminEmail = process.env.DEFAULT_ADMIN_EMAIL!;
// 서버 시작 시 환경 변수 체크를 했다면, 이 시점엔 확실히 있음

// 나쁜 예: 확인 없이 무조건 사용
const admin = await prisma.admin.findFirst({ where: { id } });
admin!.name;  // ← 위험! admin이 실제로 null이면 런타임 에러
```

### 이 프로젝트에서 실제 사용 예

```typescript
// prisma.service.ts
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
  // DATABASE_URL이 없으면 서버가 아예 시작 안 되므로
  // 이 시점에서는 반드시 있다고 보장할 수 있음
});
```

---

## 4가지 연산자 비교 요약

| 연산자 | 이름 | 용도 | 예시 |
|--------|------|------|------|
| `?` | 옵셔널 | 속성/매개변수를 선택적으로 | `lastLoginAt?: Date` |
| `?.` | 옵셔널 체이닝 | null 안전하게 속성 접근 | `admin?.name` |
| `??` | Nullish 병합 | null/undefined일 때 기본값 | `name ?? '기본값'` |
| `!` | Non-null 단언 | null 아님을 내가 보장 | `value!` |

---

## 실전 패턴 — 안전한 코드 작성

```typescript
// ❌ 위험한 방식
const admin = await prisma.admin.findFirst({ where: { id } });
console.log(admin.name);  // admin이 null이면 에러!

// ✅ 안전한 방식 1: 옵셔널 체이닝
console.log(admin?.name);  // null이면 undefined, 에러 없음

// ✅ 안전한 방식 2: null 체크 후 사용
if (admin) {
  console.log(admin.name);  // 이 블록 안에서 admin은 절대 null 아님
}

// ✅ 안전한 방식 3: 기본값과 함께
console.log(admin?.name ?? '관리자');

// ✅ 안전한 방식 4: 에러 throw (NestJS 패턴)
if (!admin) {
  throw new NotFoundException('관리자를 찾을 수 없습니다.');
}
// 이 아래부터 admin은 절대 null 아님
console.log(admin.name);  // 안전
```
