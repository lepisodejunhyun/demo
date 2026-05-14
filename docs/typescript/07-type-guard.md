# 타입 가드 — "이 시점에서 이 타입이 확실해요"

---

## 왜 타입 가드가 필요한가?

Union 타입을 사용할 때, TypeScript는 어떤 타입인지 모르는 상태에서는 공통된 것만 사용하게 해요.

```typescript
type Cat = { name: string; meow(): void };
type Dog = { name: string; bark(): void };

function makeSound(animal: Cat | Dog) {
  animal.name;    // OK — 둘 다 가지고 있어요
  animal.meow();  // ← 에러! Dog에는 meow가 없을 수도 있어요
  animal.bark();  // ← 에러! Cat에는 bark가 없을 수도 있어요
}
```

이럴 때 "이 시점에서 이 값은 Cat이야"라고 TypeScript에게 알려주는 것이 **타입 가드**예요.

타입 가드 이후에는 TypeScript가 해당 타입에 맞는 것들을 자유롭게 사용하게 해줘요. 이것을 **타입 좁히기(Type Narrowing)**라고 해요.

---

## 1. `typeof` — 기본 타입 확인

```typescript
function format(value: string | number): string {
  if (typeof value === 'string') {
    // 이 블록 안에서 value는 string
    return value.toUpperCase();  // OK!
  } else {
    // 이 블록 안에서 value는 number
    return value.toFixed(2);     // OK!
  }
}

// typeof가 돌려줄 수 있는 값들:
// 'string', 'number', 'boolean', 'object', 'undefined', 'function', 'symbol', 'bigint'
```

---

## 2. `instanceof` — 클래스 인스턴스 확인

```typescript
// 이 프로젝트에서 실제 사용 예
try {
  await this.prisma.admin.create({ data });
} catch (error: unknown) {
  if (error instanceof PrismaClientKnownRequestError) {
    // 이 블록에서 error는 PrismaClientKnownRequestError
    if (error.code === 'P2002') {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }
  }

  if (error instanceof Error) {
    // 이 블록에서 error는 Error
    console.log(error.message);
  }
}
```

### 클래스 구분

```typescript
class AdminError extends Error {
  constructor(public adminId: string, message: string) {
    super(message);
  }
}

class NetworkError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

function handleError(error: AdminError | NetworkError) {
  if (error instanceof AdminError) {
    // 이 블록에서 error는 AdminError
    console.log(`관리자 에러: ${error.adminId}`);
  } else {
    // 이 블록에서 error는 NetworkError
    console.log(`네트워크 에러: ${error.statusCode}`);
  }
}
```

---

## 3. `in` — 속성 존재 여부 확인

```typescript
type Cat = { name: string; meow(): void };
type Dog = { name: string; bark(): void };

function makeSound(animal: Cat | Dog) {
  if ('meow' in animal) {
    // 이 블록에서 animal은 Cat
    animal.meow();  // OK!
  } else {
    // 이 블록에서 animal은 Dog
    animal.bark();  // OK!
  }
}
```

### 이 프로젝트에서의 활용

```typescript
type AdminDto = {
  id: string;
  name: string;
  role: '관리자' | '최고관리자';
};

type GuestUser = {
  sessionId: string;
  name: string;
};

type User = AdminDto | GuestUser;

function getPermissions(user: User): string[] {
  if ('role' in user) {
    // user는 AdminDto
    return user.role === '최고관리자' ? ['read', 'write', 'delete'] : ['read', 'write'];
  } else {
    // user는 GuestUser
    return ['read'];
  }
}
```

---

## 4. 동등 비교 — 리터럴 타입 좁히기

```typescript
type Direction = 'left' | 'right' | 'up' | 'down';

function move(direction: Direction) {
  if (direction === 'left') {
    // direction은 정확히 'left'
    console.log("왼쪽으로 이동");
  } else if (direction === 'right') {
    // direction은 정확히 'right'
    console.log("오른쪽으로 이동");
  }
}

// null 체크도 타입 가드예요
function processAdmin(admin: AdminDto | null) {
  if (admin === null) {
    // admin은 null
    throw new NotFoundException('관리자를 찾을 수 없습니다.');
  }

  // 여기서부터 admin은 AdminDto (null 제거됨)
  console.log(admin.name);  // OK!
}
```

---

## 5. Truthy/Falsy 체크

```typescript
function processAdmin(admin: AdminDto | null | undefined) {
  if (!admin) {
    // admin은 null 또는 undefined
    return;
  }

  // 여기서부터 admin은 AdminDto
  console.log(admin.name);  // OK!
}

// if (admin) 도 타입 가드
function greet(admin: AdminDto | null) {
  if (admin) {
    // admin은 AdminDto
    console.log(`안녕하세요, ${admin.name}님`);
  }
}
```

---

## 6. 사용자 정의 타입 가드 — `is`

직접 타입 가드 함수를 만들 수 있어요.

```typescript
// 반환 타입에 "value is Cat" → 이 함수가 true를 반환하면 value는 Cat
function isCat(animal: Cat | Dog): animal is Cat {
  return 'meow' in animal;
}

function makeSound(animal: Cat | Dog) {
  if (isCat(animal)) {
    // 이 블록에서 animal은 Cat
    animal.meow();  // OK!
  } else {
    // 이 블록에서 animal은 Dog
    animal.bark();  // OK!
  }
}
```

### 실제 활용 — null 체크 함수

```typescript
// null/undefined인지 확인하는 유틸
function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

const admins: (AdminDto | null)[] = [
  { id: "1", name: "홍길동" },
  null,
  { id: "2", name: "김철수" },
];

// filter 후에도 null이 남아있다고 TypeScript는 생각해요
const filtered1 = admins.filter(a => a !== null);
// 타입: (AdminDto | null)[]  ← null 제거 안 됨

// 사용자 정의 타입 가드 사용
const filtered2 = admins.filter(isNotNull);
// 타입: AdminDto[]  ← null이 제거됨!
```

---

## 7. `never` 타입으로 완전성 검사

모든 케이스를 처리했는지 컴파일 타임에 검사할 수 있어요.

```typescript
type AdminRole = '관리자' | '최고관리자';

function getRoleDescription(role: AdminRole): string {
  switch (role) {
    case '관리자':
      return '일반 관리자';
    case '최고관리자':
      return '최고 관리자 — 모든 권한';
    default:
      // 여기에 도달하면 처리 안 된 케이스가 있다는 뜻
      const _exhaustive: never = role;
      return _exhaustive;  // 이 코드에 도달하면 TypeScript 에러 발생
  }
}

// 나중에 AdminRole에 '게스트'를 추가하면?
type AdminRole = '관리자' | '최고관리자' | '게스트';
// → default 블록에서 타입 에러 발생!
// → "게스트를 처리 안 했어요" 라고 TypeScript가 알려줌
```

---

## 이 프로젝트에서 실제 타입 가드 패턴

### NestJS — 에러 처리

```typescript
// admin.service.ts 패턴
async signIn(data: AdminSignInDTO): Promise<Admin> {
  const admin = await this.prisma.admin.findFirst({
    where: { email: data.email },
  });

  // null 체크 타입 가드
  if (!admin) {
    throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다.');
  }

  // 여기서부터 admin은 Admin (null 제거됨)
  const isPasswordValid = compareSync(data.password, admin.password);

  if (!isPasswordValid) {
    // 잠금 처리 등...
    throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다.');
  }

  return admin;  // Admin 타입
}
```

### Angular — 템플릿 타입 가드

```typescript
// admin.store.ts
readonly user = signal<AdminDto | null>(null);

// 컴포넌트에서
const currentUser = this.adminStore.user();
if (currentUser) {
  // currentUser는 AdminDto
  console.log(currentUser.name);
}
```

---

## 타입 가드 선택 가이드

```
기본 타입 확인 (string, number 등) → typeof
클래스 인스턴스 확인             → instanceof
특정 속성 있는지 확인             → in
리터럴 값 확인                   → === 비교
null/undefined 확인              → if(value), value !== null
복잡한 조건이나 재사용            → 사용자 정의 타입 가드 (is)
```
