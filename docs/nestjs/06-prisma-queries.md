# Prisma 쿼리 완전 정복 — 자주 쓰는 함수와 문법

---

## 목차

1. [기본 CRUD](#1-기본-crud)
2. [where — 조건 필터링](#2-where--조건-필터링)
3. [select — 필드 선택](#3-select--필드-선택)
4. [include — 관계 데이터 포함](#4-include--관계-데이터-포함)
5. [orderBy — 정렬](#5-orderby--정렬)
6. [take / skip — 페이지네이션](#6-take--skip--페이지네이션)
7. [update — 데이터 수정](#7-update--데이터-수정)
8. [upsert — 있으면 수정, 없으면 생성](#8-upsert--있으면-수정-없으면-생성)
9. [delete — 데이터 삭제](#9-delete--데이터-삭제)
10. [count / aggregate — 집계](#10-count--aggregate--집계)
11. [$transaction — 트랜잭션](#11-transaction--트랜잭션)
12. [이 프로젝트에서 쓰는 실제 패턴](#12-이-프로젝트에서-쓰는-실제-패턴)

---

## 1. 기본 CRUD

### `findMany` — 여러 개 조회

조건에 맞는 **모든** 레코드를 배열로 반환해요.

```typescript
// 모든 관리자 조회
const admins = await prisma.admin.findMany();
// 결과: Admin[] (배열)

// 조건 포함
const admins = await prisma.admin.findMany({
  where: { deletedAt: null },  // 삭제 안 된 관리자만
});
```

결과가 없으면 빈 배열 `[]`을 반환해요 (null이나 에러가 아님).

---

### `findFirst` — 조건에 맞는 첫 번째 하나

조건에 맞는 레코드 중 **첫 번째 하나**만 반환해요.

```typescript
// 이메일로 관리자 찾기
const admin = await prisma.admin.findFirst({
  where: { email: 'admin@test.com' },
});
// 결과: Admin | null (없으면 null)
```

결과가 없으면 `null`을 반환해요.

---

### `findUnique` — 고유값으로 정확히 하나 조회

`@unique` 또는 `@id` 필드로만 조회할 수 있어요.

```typescript
// id로 조회 (@id 필드)
const admin = await prisma.admin.findUnique({
  where: { id: 'uuid-123' },
});

// email로 조회 (@unique 필드)
const admin = await prisma.admin.findUnique({
  where: { email: 'admin@test.com' },
});
// 결과: Admin | null
```

`findFirst`와 차이점:
- `findFirst` → 일반 where 조건, 여러 결과 중 첫 번째
- `findUnique` → 유일한 식별자로 정확히 하나 조회, 더 빠름

---

### `create` — 새 레코드 생성

```typescript
const newAdmin = await prisma.admin.create({
  data: {
    email: 'new@test.com',
    password: hashedPassword,
    name: '새 관리자',
    role: AdminRole.관리자,
    // id, createdAt, updatedAt은 자동 생성
  },
});
// 결과: 생성된 Admin 객체
```

---

### `createMany` — 여러 개 한번에 생성

```typescript
const result = await prisma.admin.createMany({
  data: [
    { email: 'admin1@test.com', password: '...', name: '관리자1' },
    { email: 'admin2@test.com', password: '...', name: '관리자2' },
  ],
  skipDuplicates: true,  // 중복 데이터는 건너뜀
});
// 결과: { count: 2 } (생성된 개수)
```

---

## 2. `where` — 조건 필터링

### 기본 동등 비교

```typescript
// email이 정확히 일치
where: { email: 'admin@test.com' }

// null인지 확인
where: { deletedAt: null }

// null이 아닌 것
where: { lastLoginAt: { not: null } }
```

---

### 문자열 검색

```typescript
// 포함 여부 (LIKE '%검색어%')
where: { name: { contains: '관리자' } }

// 대소문자 무시 검색
where: { name: { contains: '관리자', mode: 'insensitive' } }

// 시작 문자열 (LIKE '검색어%')
where: { email: { startsWith: 'admin' } }

// 끝 문자열 (LIKE '%검색어')
where: { email: { endsWith: '@test.com' } }
```

---

### 숫자/날짜 비교

```typescript
// gt: greater than (초과)
where: { failCount: { gt: 0 } }     // failCount > 0

// gte: greater than or equal (이상)
where: { failCount: { gte: 5 } }    // failCount >= 5

// lt: less than (미만)
where: { failCount: { lt: 10 } }    // failCount < 10

// lte: less than or equal (이하)
where: { failCount: { lte: 3 } }    // failCount <= 3

// 날짜 비교
where: {
  createdAt: {
    gte: new Date('2025-01-01'),
    lt: new Date('2025-12-31'),
  }
}
```

---

### `in` / `notIn` — 여러 값 중 포함 여부

```typescript
// role이 '관리자' 또는 '최고관리자' 중 하나인 것
where: { role: { in: ['관리자', '최고관리자'] } }

// 특정 id 목록 중 하나인 것
where: { id: { in: ['uuid-1', 'uuid-2', 'uuid-3'] } }

// 포함되지 않는 것
where: { role: { notIn: ['관리자'] } }
```

---

### `AND` / `OR` / `NOT` — 복합 조건

```typescript
// AND: 두 조건 모두 만족 (기본 동작과 동일)
where: {
  AND: [
    { email: 'admin@test.com' },
    { deletedAt: null },
  ]
}

// 위와 동일한 표현 (AND는 기본값이므로 생략 가능)
where: {
  email: 'admin@test.com',
  deletedAt: null,
}

// OR: 둘 중 하나만 만족
where: {
  OR: [
    { email: 'admin@test.com' },
    { name: '최고 관리자' },
  ]
}
// email이 admin@test.com 이거나 이름이 최고 관리자인 것

// NOT: 조건의 반대
where: {
  NOT: { deletedAt: null }
}
// deletedAt이 null이 아닌 것 (삭제된 것들)
```

---

### 복합 조건 예시

```typescript
// 삭제 안 됐고, 잠기지 않았고, 로그인 실패 5회 미만인 관리자
where: {
  deletedAt: null,
  lockedUntil: null,
  failCount: { lt: 5 },
}

// (최고관리자 이거나 failCount가 0) 이고 deletedAt이 null인 것
where: {
  AND: [
    { deletedAt: null },
    {
      OR: [
        { role: '최고관리자' },
        { failCount: 0 },
      ]
    }
  ]
}
```

---

## 3. `select` — 필드 선택

DB에서 필요한 필드만 가져와요. 성능 최적화에 중요해요.

```typescript
const admins = await prisma.admin.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    // password: false (기본값, 생략 가능)
    // role: false (기본값)
  }
});
// 결과: { id: string, email: string, name: string }[]
// password, role 등은 포함되지 않음
```

**주의:** `select`를 쓰면 지정한 필드만 반환해요. 나머지는 결과 객체에 없어요.

```typescript
const admin = await prisma.admin.findFirst({
  select: { email: true, name: true }
});

console.log(admin.email);  // OK
console.log(admin.password); // TypeScript 에러! (select에 없음)
```

---

## 4. `include` — 관계 데이터 포함

다른 모델과 연결된 데이터를 함께 가져와요.

현재 이 프로젝트는 관계가 없지만, 예시로 설명할게요.

```prisma
// 만약 이런 관계가 있다면 (가정)
model Admin {
  id      String @id @default(uuid())
  logs    LoginLog[]   // 로그인 기록과 1:N 관계
}

model LoginLog {
  id      String @id @default(uuid())
  adminId String
  admin   Admin  @relation(fields: [adminId], references: [id])
  loginAt DateTime
}
```

```typescript
// 관리자 조회 시 로그인 기록도 함께 가져오기
const admin = await prisma.admin.findFirst({
  where: { id: 'uuid-123' },
  include: {
    logs: true,  // 관련된 LoginLog 전체 포함
  }
});
// 결과: { id, email, ..., logs: LoginLog[] }

// 조건을 걸어서 가져오기
const admin = await prisma.admin.findFirst({
  where: { id: 'uuid-123' },
  include: {
    logs: {
      where: { loginAt: { gte: new Date('2025-01-01') } },
      orderBy: { loginAt: 'desc' },
      take: 10,  // 최근 10개만
    },
  }
});
```

**`select` vs `include` 차이:**

```
select → 이 모델에서 어떤 필드를 가져올지 선택
include → 연결된 다른 모델 데이터를 추가로 포함
```

---

## 5. `orderBy` — 정렬

```typescript
// 생성일 내림차순 (최신순)
const admins = await prisma.admin.findMany({
  orderBy: { createdAt: 'desc' },  // desc: 내림차순
});

// 이름 오름차순
const admins = await prisma.admin.findMany({
  orderBy: { name: 'asc' },  // asc: 오름차순
});

// 여러 기준으로 정렬 (1순위: role, 2순위: createdAt)
const admins = await prisma.admin.findMany({
  orderBy: [
    { role: 'asc' },
    { createdAt: 'desc' },
  ],
});
```

---

## 6. `take` / `skip` — 페이지네이션

```typescript
// take: 몇 개 가져올지 (LIMIT)
const admins = await prisma.admin.findMany({
  take: 10,  // 10개만
});

// skip: 몇 개 건너뛸지 (OFFSET)
const admins = await prisma.admin.findMany({
  skip: 20,  // 앞의 20개 건너뛰고
  take: 10,  // 10개 가져오기
});
// 21~30번째 데이터
```

**페이지 번호로 계산하는 방법:**

```typescript
const page = 3;     // 3페이지
const pageSize = 10; // 한 페이지에 10개

const admins = await prisma.admin.findMany({
  skip: (page - 1) * pageSize,  // (3-1) * 10 = 20개 건너뜀
  take: pageSize,                // 10개 가져옴
  orderBy: { createdAt: 'desc' },
});
// 3페이지 = 21~30번째 데이터
```

---

## 7. `update` — 데이터 수정

### `update` — 하나 수정

반드시 고유 식별자(`@id` 또는 `@unique` 필드)로 찾아서 수정해요.

```typescript
// id로 찾아서 수정
const updated = await prisma.admin.update({
  where: { id: 'uuid-123' },
  data: {
    name: '새 이름',
    lastLoginAt: new Date(),
  },
});
// 결과: 수정된 Admin 객체

// email(@unique)로 찾아서 수정
const updated = await prisma.admin.update({
  where: { email: 'admin@test.com' },
  data: { failCount: 0 },
});
```

---

### 숫자 증감 — `increment` / `decrement`

```typescript
// failCount를 1 증가
const updated = await prisma.admin.update({
  where: { id: 'uuid-123' },
  data: {
    failCount: { increment: 1 }
  },
});

// failCount를 1 감소
data: { failCount: { decrement: 1 } }

// failCount를 0으로 리셋
data: { failCount: 0 }
```

---

### `updateMany` — 여러 개 수정

```typescript
// 특정 조건의 모든 레코드 수정
const result = await prisma.admin.updateMany({
  where: { role: '관리자' },
  data: { failCount: 0 },
});
// 결과: { count: 수정된 개수 }
```

**주의:** `updateMany`는 수정된 객체가 아닌 `{ count: n }`만 반환해요.

---

## 8. `upsert` — 있으면 수정, 없으면 생성

```typescript
const admin = await prisma.admin.upsert({
  where: { email: 'admin@test.com' },  // 찾는 조건
  update: {
    lastLoginAt: new Date(),   // 있으면 이 데이터로 수정
  },
  create: {
    email: 'admin@test.com',   // 없으면 이 데이터로 생성
    password: hashedPassword,
    name: '관리자',
  },
});
```

이 프로젝트의 `onModuleInit`에서 기본 관리자를 생성할 때 `upsert`를 쓸 수도 있어요:

```typescript
// 현재 코드 (findFirst → create 방식)
const existing = await prisma.admin.findFirst({ where: { email } });
if (!existing) {
  await prisma.admin.create({ data: {...} });
}

// upsert로 단순화
await prisma.admin.upsert({
  where: { email },
  update: {},          // 이미 있으면 수정 없음
  create: { email, password, name, role },
});
```

---

## 9. `delete` — 데이터 삭제

### `delete` — 하나 삭제 (물리 삭제)

```typescript
const deleted = await prisma.admin.delete({
  where: { id: 'uuid-123' },
});
// 결과: 삭제된 Admin 객체 (삭제 전 데이터)
```

**주의:** 실제로 DB에서 완전히 지워져요. 복구 불가!

---

### `deleteMany` — 여러 개 삭제

```typescript
const result = await prisma.admin.deleteMany({
  where: { deletedAt: { not: null } },
});
// 결과: { count: 삭제된 개수 }
```

---

### 소프트 삭제 (이 프로젝트 방식) — 권장

```typescript
// 실제 삭제 대신 deletedAt 필드에 시간 기록
const softDeleted = await prisma.admin.update({
  where: { id: 'uuid-123' },
  data: { deletedAt: new Date() },
});
```

복구할 때:

```typescript
// deletedAt을 null로 되돌리면 복구
await prisma.admin.update({
  where: { id: 'uuid-123' },
  data: { deletedAt: null },
});
```

---

## 10. `count` / `aggregate` — 집계

### `count` — 개수 세기

```typescript
// 전체 관리자 수
const total = await prisma.admin.count();
// 결과: 숫자 (예: 5)

// 조건에 맞는 개수
const activeCount = await prisma.admin.count({
  where: { deletedAt: null },
});
```

---

### `aggregate` — 합계, 평균, 최대, 최소

```typescript
const stats = await prisma.admin.aggregate({
  _count: { id: true },           // 전체 개수
  _avg: { failCount: true },      // failCount 평균
  _sum: { failCount: true },      // failCount 합계
  _max: { failCount: true },      // failCount 최댓값
  _min: { failCount: true },      // failCount 최솟값
  where: { deletedAt: null },
});

console.log(stats._count.id);    // 전체 관리자 수
console.log(stats._avg.failCount); // 평균 실패 횟수
```

---

### `groupBy` — 그룹별 집계

```typescript
// role별 관리자 수
const result = await prisma.admin.groupBy({
  by: ['role'],
  _count: { id: true },
});
// 결과:
// [
//   { role: '관리자', _count: { id: 8 } },
//   { role: '최고관리자', _count: { id: 2 } }
// ]
```

---

## 11. `$transaction` — 트랜잭션

여러 쿼리를 **하나의 단위**로 실행해요. 중간에 실패하면 전부 취소(rollback)돼요.

```
예시: 계좌 이체
  1. A 계좌에서 100원 차감
  2. B 계좌에 100원 추가

  1번만 되고 2번이 실패하면? → 돈이 사라짐!
  트랜잭션 사용 시 → 둘 다 성공하거나 둘 다 취소
```

---

### 배열 방식 (순차 실행)

```typescript
const [updatedAdmin, newLog] = await prisma.$transaction([
  // 1. 관리자의 마지막 로그인 시간 업데이트
  prisma.admin.update({
    where: { id: 'uuid-123' },
    data: { lastLoginAt: new Date() },
  }),
  // 2. 로그인 로그 생성 (모델이 있다면)
  prisma.loginLog.create({
    data: { adminId: 'uuid-123', loginAt: new Date() },
  }),
]);
// 둘 다 성공하면 결과 반환
// 하나라도 실패하면 둘 다 취소
```

---

### 인터랙티브 트랜잭션 (조건부 로직 포함)

```typescript
await prisma.$transaction(async (tx) => {
  // tx를 prisma 대신 사용
  const admin = await tx.admin.findFirst({
    where: { email: 'admin@test.com' },
  });

  if (!admin) throw new Error('관리자 없음'); // 에러 → 전체 rollback

  await tx.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date(), failCount: 0 },
  });

  // 로그인 횟수 증가 등 추가 로직
});
```

인터랙티브 트랜잭션은 조건문이나 반복문을 포함할 수 있어요.

---

### `$executeRaw` / `$queryRaw` — 직접 SQL 실행

Prisma로 표현하기 어려운 복잡한 쿼리에서 사용해요.

```typescript
// 실행만 (결과 필요 없을 때)
await prisma.$executeRaw`SET TIME ZONE 'Asia/Seoul'`;

// 이 프로젝트의 PrismaService에서 실제로 사용 중!
async onModuleInit() {
  await this.$connect();
  await this.$executeRaw`SET TIME ZONE 'Asia/Seoul'`;
}
```

```typescript
// 결과가 필요할 때 (타입 지정 필요)
const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
  SELECT COUNT(*) as count FROM "Admin" WHERE "deletedAt" IS NULL
`;
```

**주의:** Raw SQL은 SQL Injection에 취약할 수 있어요. 반드시 템플릿 리터럴(백틱) 방식을 사용하고, 변수를 직접 문자열로 넣지 마세요.

```typescript
// 안전 (템플릿 리터럴 → Prisma가 파라미터 바인딩 처리)
await prisma.$executeRaw`DELETE FROM "Admin" WHERE id = ${adminId}`;

// 위험! (SQL Injection 가능)
await prisma.$executeRawUnsafe(`DELETE FROM "Admin" WHERE id = '${adminId}'`);
```

---

## 12. 이 프로젝트에서 쓰는 실제 패턴

### 로그인 — `findFirst` + `compareSync`

```typescript
// admin.service.ts에서 실제 사용
const admin = await this.prisma.admin.findFirst({
  where: {
    email: email,
    deletedAt: null,  // 소프트 삭제된 계정 제외
  },
});

if (!admin) {
  throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
}
```

---

### 전체 조회 — `findMany`

```typescript
// admin.service.ts에서 실제 사용
const admins = await this.prisma.admin.findMany({});
```

---

### 초기 관리자 생성 — `findFirst` → `create`

```typescript
// admin.module.ts onModuleInit에서 실제 사용
const existingAdmin = await this.prisma.admin.findFirst({
  where: { email: this.defaultAdminEmail },
});

if (!existingAdmin) {
  await this.prisma.admin.create({
    data: {
      email: this.defaultAdminEmail,
      password: hashSync(this.defaultAdminpassword, 10),
      name: '최고 관리자',
      role: AdminRole.최고관리자,
    }
  });
}
```

---

## 함수 빠른 참조표

| 함수 | 설명 | 반환값 |
|------|------|--------|
| `findMany()` | 조건에 맞는 전체 조회 | `Model[]` |
| `findFirst()` | 조건에 맞는 첫 번째 | `Model \| null` |
| `findUnique()` | 고유값으로 정확히 하나 | `Model \| null` |
| `create()` | 새 레코드 생성 | `Model` |
| `createMany()` | 여러 개 동시 생성 | `{ count: n }` |
| `update()` | 하나 수정 | `Model` |
| `updateMany()` | 조건에 맞는 여러 개 수정 | `{ count: n }` |
| `upsert()` | 있으면 수정, 없으면 생성 | `Model` |
| `delete()` | 하나 물리 삭제 | `Model` |
| `deleteMany()` | 여러 개 물리 삭제 | `{ count: n }` |
| `count()` | 개수 세기 | `number` |
| `aggregate()` | 합계/평균/최대/최소 | 집계 결과 객체 |
| `groupBy()` | 그룹별 집계 | 그룹 배열 |
| `$transaction()` | 트랜잭션 | 각 쿼리 결과 배열 |
| `$executeRaw` | SQL 직접 실행 | `number` (영향받은 행 수) |
| `$queryRaw` | SQL 직접 조회 | `unknown[]` |

---

## `where` 연산자 빠른 참조표

| 연산자 | 설명 | 예시 |
|--------|------|------|
| `equals` | 같음 (기본값) | `{ name: '홍길동' }` |
| `not` | 다름 | `{ name: { not: '홍길동' } }` |
| `in` | 목록 중 포함 | `{ role: { in: ['관리자'] } }` |
| `notIn` | 목록에 없음 | `{ role: { notIn: ['관리자'] } }` |
| `contains` | 문자열 포함 | `{ name: { contains: '관리' } }` |
| `startsWith` | 시작 문자열 | `{ email: { startsWith: 'admin' } }` |
| `endsWith` | 끝 문자열 | `{ email: { endsWith: '.com' } }` |
| `gt` | 초과 (`>`) | `{ failCount: { gt: 0 } }` |
| `gte` | 이상 (`>=`) | `{ failCount: { gte: 5 } }` |
| `lt` | 미만 (`<`) | `{ failCount: { lt: 10 } }` |
| `lte` | 이하 (`<=`) | `{ failCount: { lte: 3 } }` |
| `AND` | 모두 만족 | `{ AND: [{...}, {...}] }` |
| `OR` | 하나 이상 만족 | `{ OR: [{...}, {...}] }` |
| `NOT` | 조건의 반대 | `{ NOT: { deletedAt: null } }` |
