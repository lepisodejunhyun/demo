# Prisma 관계(Relations) — 1:1, 1:N, N:M

---

## 관계란?

데이터베이스에서 테이블들은 서로 연결될 수 있어요.

예를 들어:
- 관리자(Admin) 1명이 여러 개의 로그인 기록(LoginLog)을 가질 수 있어요
- 게시글(Post) 1개는 1명의 작성자(Admin)와 연결돼요
- 관리자(Admin) 1명이 여러 권한(Permission)을 가질 수 있고, 하나의 권한을 여러 관리자가 가질 수도 있어요

이런 관계를 Prisma 스키마에서 어떻게 표현하는지 알아볼게요.

---

## 1. 1:N 관계 (가장 흔한 패턴)

한 관리자가 여러 로그인 기록을 가지는 경우예요.

```
Admin (1) ──── LoginLog (N)
관리자 1명이 → 로그인 기록 여러 개
```

### 스키마 정의

```prisma
model Admin {
  id          String      @id @default(uuid())
  name        String
  email       String      @unique
  password    String
  role        AdminRole   @default(관리자)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  deletedAt   DateTime?

  // 1:N 관계 — Admin이 여러 LoginLog를 가짐
  loginLogs   LoginLog[]
}

model LoginLog {
  id        String   @id @default(uuid())
  loginAt   DateTime @default(now())
  ip        String?

  // 외래키 — 어느 Admin의 기록인지
  adminId   String
  admin     Admin    @relation(fields: [adminId], references: [id])
}
```

**핵심 문법:**

```
Admin 쪽:
  loginLogs   LoginLog[]    ← 배열(여러 개)로 표시

LoginLog 쪽:
  adminId   String          ← 실제 DB에 저장되는 외래키(FK)
  admin     Admin           ← Admin 객체로 접근하기 위한 가상 필드
             @relation(
               fields: [adminId],      ← LoginLog의 어떤 필드가 FK인지
               references: [id]        ← Admin의 어떤 필드를 참조하는지
             )
```

### 마이그레이션 후 생성되는 SQL

```sql
CREATE TABLE "LoginLog" (
  "id"      TEXT NOT NULL,
  "loginAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "ip"      TEXT,
  "adminId" TEXT NOT NULL,   -- 외래키
  CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LoginLog_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "Admin"("id")  -- FK 제약조건
);
```

### 쿼리 방법

**관리자 조회할 때 로그인 기록도 함께:**

```typescript
const admin = await prisma.admin.findFirst({
  where: { id: 'uuid-123' },
  include: {
    loginLogs: true,  // 모든 로그인 기록 포함
  }
});
// 결과: { id, name, ..., loginLogs: LoginLog[] }

// 조건 걸기
const admin = await prisma.admin.findFirst({
  where: { id: 'uuid-123' },
  include: {
    loginLogs: {
      orderBy: { loginAt: 'desc' },  // 최신순
      take: 5,                        // 최근 5개만
    },
  }
});
```

**로그인 기록 조회할 때 관리자 정보도 함께:**

```typescript
const log = await prisma.loginLog.findFirst({
  where: { id: 'log-uuid' },
  include: {
    admin: true,  // 연결된 Admin 포함
  }
});
// 결과: { id, loginAt, adminId, admin: Admin }

console.log(log.admin.name);  // 로그인한 관리자 이름
```

**로그인 기록 생성 (관리자와 연결):**

```typescript
// adminId를 직접 지정
const log = await prisma.loginLog.create({
  data: {
    ip: '192.168.1.1',
    adminId: 'uuid-123',  // 연결할 Admin의 id
  }
});

// 또는 connect 사용
const log = await prisma.loginLog.create({
  data: {
    ip: '192.168.1.1',
    admin: {
      connect: { id: 'uuid-123' }  // 기존 Admin과 연결
    }
  }
});
```

**특정 관리자의 로그 개수:**

```typescript
const logCount = await prisma.loginLog.count({
  where: { adminId: 'uuid-123' }
});
```

---

## 2. 1:1 관계

한 관리자가 하나의 프로필 이미지를 가지는 경우예요.

```
Admin (1) ──── AdminProfile (1)
관리자 1명 → 프로필 정보 1개
```

### 스키마 정의

```prisma
model Admin {
  id      String        @id @default(uuid())
  email   String        @unique
  // ...

  profile AdminProfile?  // 1:1 관계 (없을 수도 있어서 ?)
}

model AdminProfile {
  id          String  @id @default(uuid())
  avatarUrl   String?
  bio         String?

  // 1:1 관계 — @unique가 핵심!
  adminId     String  @unique  // ← @unique 덕분에 1:1 강제
  admin       Admin   @relation(fields: [adminId], references: [id])
}
```

**1:N과 1:1의 차이점:**

```
1:N → adminId: String          (여러 개 가질 수 있음)
1:1 → adminId: String @unique  (@unique로 중복 방지 → 딱 하나만)
```

### 쿼리 방법

```typescript
// 프로필과 함께 조회
const admin = await prisma.admin.findFirst({
  where: { id: 'uuid-123' },
  include: { profile: true }
});
// admin.profile?.avatarUrl

// 프로필 없는 관리자 필터링
const adminsWithoutProfile = await prisma.admin.findMany({
  where: { profile: null }
});

// 프로필 생성과 동시에 관리자와 연결
await prisma.adminProfile.create({
  data: {
    avatarUrl: 'https://...',
    admin: { connect: { id: 'uuid-123' } }
  }
});
```

---

## 3. N:M 관계 (다대다)

관리자가 여러 권한을 가지고, 하나의 권한을 여러 관리자가 가지는 경우예요.

```
Admin (N) ──── AdminPermission (중간 테이블) ──── Permission (M)
관리자 여러 명 ↔ 권한 여러 개
```

### 방법 1: 명시적 중간 테이블 (권장)

```prisma
model Admin {
  id          String @id @default(uuid())
  email       String @unique
  // ...

  permissions AdminPermission[]  // 중간 테이블 참조
}

model Permission {
  id          String @id @default(uuid())
  name        String @unique  // 'READ', 'WRITE', 'DELETE' 등
  description String?

  admins      AdminPermission[]  // 중간 테이블 참조
}

// 중간 테이블 (Junction Table)
model AdminPermission {
  id           String   @id @default(uuid())
  assignedAt   DateTime @default(now())  // 권한 부여 시간 등 추가 정보 가능

  adminId      String
  admin        Admin      @relation(fields: [adminId], references: [id])

  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id])

  @@unique([adminId, permissionId])  // 같은 권한 중복 부여 방지
}
```

### 쿼리 방법

```typescript
// 관리자의 모든 권한 조회
const admin = await prisma.admin.findFirst({
  where: { id: 'uuid-123' },
  include: {
    permissions: {
      include: {
        permission: true  // 중간 테이블 → 실제 Permission 데이터
      }
    }
  }
});

admin.permissions.forEach(ap => {
  console.log(ap.permission.name);  // 'READ', 'WRITE' 등
});

// 관리자에게 권한 부여
await prisma.adminPermission.create({
  data: {
    adminId: 'uuid-123',
    permissionId: 'permission-uuid',
  }
});

// 관리자에게 여러 권한 한 번에 부여
await prisma.adminPermission.createMany({
  data: [
    { adminId: 'uuid-123', permissionId: 'perm-1' },
    { adminId: 'uuid-123', permissionId: 'perm-2' },
  ],
  skipDuplicates: true,
});

// 특정 권한을 가진 관리자 목록
const adminsWithWritePermission = await prisma.admin.findMany({
  where: {
    permissions: {
      some: {           // 하나라도 조건에 맞는 것이 있으면
        permission: { name: 'WRITE' }
      }
    }
  }
});
```

### 방법 2: 암시적 중간 테이블 (간단하지만 제한적)

추가 정보가 필요 없을 때 Prisma가 중간 테이블을 자동으로 만들어줘요.

```prisma
model Admin {
  id          String       @id @default(uuid())
  permissions Permission[] // 직접 연결 (중간 테이블 자동 생성)
}

model Permission {
  id     String  @id @default(uuid())
  name   String  @unique
  admins Admin[]  // 직접 연결
}
```

단점: 중간 테이블에 `assignedAt` 같은 추가 필드를 넣을 수 없어요.

---

## 관계 쿼리 연산자

### `some` — 하나라도 조건에 맞으면

```typescript
// 로그인 기록이 하나라도 있는 관리자
where: {
  loginLogs: {
    some: {}  // 비어있지 않으면
  }
}

// 특정 IP로 로그인한 적 있는 관리자
where: {
  loginLogs: {
    some: { ip: '192.168.1.1' }
  }
}
```

### `every` — 모든 것이 조건에 맞으면

```typescript
// 모든 로그인 기록이 오늘인 관리자 (이론적 예시)
where: {
  loginLogs: {
    every: {
      loginAt: { gte: new Date('2025-01-01') }
    }
  }
}
```

### `none` — 조건에 맞는 것이 하나도 없으면

```typescript
// 로그인 기록이 전혀 없는 관리자
where: {
  loginLogs: {
    none: {}
  }
}
```

---

## 관계 삭제 처리 (`onDelete`)

연결된 데이터를 지울 때 어떻게 할지 설정해요.

```prisma
model LoginLog {
  adminId   String
  admin     Admin  @relation(fields: [adminId], references: [id], onDelete: Cascade)
  //                                                                         ^^^^^^^
}
```

| 옵션 | 설명 |
|------|------|
| `Cascade` | 부모(Admin)를 지우면 자식(LoginLog)도 자동 삭제 |
| `Restrict` | 자식이 있으면 부모 삭제 불가 (기본값) |
| `SetNull` | 부모 삭제 시 자식의 FK를 NULL로 설정 |
| `NoAction` | DB가 알아서 처리 (DB마다 다름) |

```typescript
// Cascade 설정 시:
await prisma.admin.delete({ where: { id: 'uuid-123' } });
// → Admin 삭제됨
// → 이 Admin의 모든 LoginLog도 자동 삭제됨

// Restrict 설정 시 (기본값):
await prisma.admin.delete({ where: { id: 'uuid-123' } });
// → LoginLog가 있으면 에러 발생!
// → 먼저 LoginLog를 전부 지워야 Admin 삭제 가능
```

---

## 이 프로젝트에 관계를 추가한다면?

현재 `Admin` 모델에 추가하기 좋은 관계들:

```prisma
model Admin {
  id          String   @id @default(uuid())
  // ... 기존 필드들

  // 앞으로 추가할 수 있는 관계들
  loginLogs   LoginLog[]         // 로그인 이력
  auditLogs   AuditLog[]         // 관리 활동 이력
  permissions AdminPermission[]  // 권한 목록
}
```

관계를 추가한 후:
```bash
pnpm prisma migrate dev --name add_login_log_relation
pnpm prisma generate
```

TypeScript 타입이 자동으로 업데이트돼요.
