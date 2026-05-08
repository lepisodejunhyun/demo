# Prisma — 데이터베이스 연결과 스키마 정의

**파일 위치:**
- `prisma/admin.prisma` (스키마 정의)
- `prisma/schema.prisma` (generator, datasource 설정)
- `prisma.config.ts` (Prisma 7 설정 파일)

---

## Prisma란 무엇인가?

데이터베이스(PostgreSQL)에서 데이터를 가져오고 저장하려면 SQL 쿼리를 써야 해요.

SQL 방식:
```sql
SELECT id, name, email FROM "Admin" WHERE email = 'test@test.com' AND deleted_at IS NULL;
```

Prisma 방식:
```typescript
await prisma.admin.findFirst({
  where: { email: 'test@test.com', deletedAt: null }
});
```

Prisma는 SQL을 직접 쓰지 않고 **TypeScript 코드로 DB를 다룰 수 있게** 해주는 ORM(Object-Relational Mapper)이에요.

**장점:**
- SQL 몰라도 TypeScript로 DB 조작 가능
- 자동 완성 지원 (타입 추론)
- 타입 안전성 (잘못된 쿼리는 컴파일 에러)
- DB 스키마 변경을 추적하는 마이그레이션 관리

---

## prisma.config.ts — Prisma 7 설정

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma",              // prisma 폴더 안의 모든 .prisma 파일
  migrations: {
    path: "prisma/migrations",   // 마이그레이션 파일 저장 위치
  },
  datasource: {
    url: process.env["DATABASE_URL"],  // 환경 변수에서 DB URL
  },
});
```

### `schema: "prisma"` — 다중 스키마 파일

Prisma 6 이전에는 스키마를 `schema.prisma` 파일 하나에만 작성할 수 있었어요.

Prisma 6부터는 폴더 경로를 지정하면 그 안의 모든 `.prisma` 파일을 합쳐서 읽어요.

```
prisma/
├── schema.prisma     ← generator, datasource 설정
└── admin.prisma      ← Admin 모델 (도메인별 분리)
```

나중에 다른 도메인이 추가되면:
```
prisma/
├── schema.prisma
├── admin.prisma      ← 관리자
├── product.prisma    ← 상품 (추후 추가)
└── order.prisma      ← 주문 (추후 추가)
```

---

### `datasource.url`

```typescript
datasource: {
  url: process.env["DATABASE_URL"],
}
```

`DATABASE_URL`은 `.env` 파일에 있어요:

```
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
```

URL 구조:
```
postgresql://  →  PostgreSQL 사용
username       →  DB 사용자 이름
password       →  DB 비밀번호
localhost      →  DB 서버 주소
5432           →  PostgreSQL 기본 포트
dbname         →  사용할 DB 이름
```

---

## schema.prisma — Generator & Datasource

```prisma
generator client {
  provider = "prisma-client-js"
}
```

`generator client` — Prisma 클라이언트(TypeScript 코드)를 자동 생성하는 설정이에요.

`pnpm prisma generate` 명령을 실행하면:

```
schema.prisma + admin.prisma 읽기
    ↓
TypeScript 타입과 함수 자동 생성
    ↓
node_modules/@prisma/client/ 에 저장

생성되는 것들:
  - prisma.admin.findMany()   ← Admin 조회 함수
  - prisma.admin.create()     ← Admin 생성 함수
  - Admin 타입               ← TypeScript 타입
  - AdminRole enum            ← 관리자 권한 enum
```

---

## admin.prisma — Admin 모델 정의

```prisma
/// @id: 기본키(Primary Key)
/// @default(uuid): 값이 없으면 자동으로 UUID 생성
/// String: 필수값 (Not Null)
/// String?: 선택값 (Nullable). 값이 비어있어도 저장 가능

model Admin {
  id          String      @id     @default(uuid())
  name        String
  email       String      @unique
  password    String
  role        AdminRole           @default(관리자)

  failCount   Int                 @default(0)
  lockedUntil DateTime?
  lastLoginAt DateTime?

  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @default(now()) @updatedAt
  deletedAt   DateTime?
}

enum AdminRole {
  관리자
  최고관리자
}
```

---

### `model Admin { ... }` — 테이블 정의

Prisma에서 `model`은 DB 테이블이에요.

```
model Admin  →  CREATE TABLE "Admin" (...)
```

---

### 각 필드 분석

**`id String @id @default(uuid())`**

```
String        → 문자열 타입
@id           → 기본키 (Primary Key). 각 레코드를 구분하는 유일한 값
@default(uuid()) → 값을 안 넣으면 UUID 자동 생성
```

UUID란:
```
"550e8400-e29b-41d4-a716-446655440000"
```
이런 형태의 긴 고유 식별자예요. 충돌할 확률이 거의 0에 가까워요.

---

**`email String @unique`**

```
@unique → 이 값은 DB 전체에서 유일해야 함
```

같은 이메일로 두 개의 관리자 계정을 만들려고 하면 DB가 에러를 반환해요.

---

**`role AdminRole @default(관리자)`**

```
AdminRole → 아래 정의된 enum 타입
@default(관리자) → 값을 안 넣으면 기본값은 '관리자'
```

---

**`String` vs `String?` (물음표)**

```
name        String    → 필수값 (NOT NULL)
lastLoginAt DateTime? → 선택값 (NULL 허용)
```

`?`가 없으면 반드시 값이 있어야 해요. 없이 저장하려 하면 DB 에러가 발생해요.
`?`가 있으면 값이 없어도 (`null`) 저장 가능해요.

---

**`createdAt DateTime @default(now())`**

```
@default(now()) → 레코드 생성 시 현재 시간 자동 입력
```

---

**`updatedAt DateTime @updatedAt`**

```
@updatedAt → 레코드가 수정될 때마다 현재 시간으로 자동 업데이트
```

Prisma가 이 필드를 특별히 처리해요. 매번 수동으로 시간을 업데이트하지 않아도 돼요.

---

**`deletedAt DateTime?` — 소프트 삭제(Soft Delete)**

실제로 DB에서 데이터를 지우지 않고, `deletedAt` 필드에 삭제된 시간을 기록하는 패턴이에요.

```
삭제 전:
  { id: "...", email: "admin@test.com", deletedAt: null }

삭제 후 (소프트 삭제):
  { id: "...", email: "admin@test.com", deletedAt: "2025-01-01T00:00:00" }
```

**왜 이렇게 하냐면:**
- 실수로 삭제했을 때 복구 가능
- 삭제 이력 보존 (언제 삭제됐는지 추적)
- 관련된 다른 데이터가 있을 때 무결성 보호

```typescript
// 조회할 때는 deletedAt이 null인 것만 조회
const admin = await this.prisma.admin.findFirst({
  where: {
    email: email,
    deletedAt: null,  // ← 삭제되지 않은 계정만
  },
});
```

---

### `enum AdminRole`

```prisma
enum AdminRole {
  관리자
  최고관리자
}
```

정해진 값들만 허용하는 타입이에요. DB 레벨에서도 이 두 가지 값만 저장 가능해요.

Prisma가 `pnpm prisma generate`를 실행하면 TypeScript enum으로 자동 생성돼요:

```typescript
// @prisma/client에서 생성됨
export const AdminRole = {
  관리자: '관리자',
  최고관리자: '최고관리자',
} as const;

export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];
```

---

## 마이그레이션 — 스키마 변경 관리

스키마를 수정한 후에는 DB에도 반영해야 해요.

```bash
# 스키마 변경을 DB에 반영하고 마이그레이션 파일 생성
pnpm prisma migrate dev --name add_admin_table

# 생성되는 파일:
# prisma/migrations/20250101000000_add_admin_table/migration.sql
```

마이그레이션 파일 예시:

```sql
-- CreateTable
CREATE TABLE "Admin" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL DEFAULT '관리자',
  ...
  CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
```

이 파일들이 Git에 저장되어, 다른 개발자나 서버에 배포할 때 동일한 DB 구조를 만들 수 있어요.

---

## Prisma 명령어 정리

```bash
# 스키마로 TypeScript 타입 생성
pnpm prisma generate

# 스키마 변경을 DB에 반영 (개발용)
pnpm prisma migrate dev --name 변경내용_설명

# DB 데이터를 GUI로 확인
pnpm prisma studio

# 배포 환경에서 마이그레이션 실행
pnpm prisma migrate deploy
```

**주의:** 이 프로젝트는 `prisma.config.ts`를 사용하므로 `pnpm prisma`로 실행해야 해요. `npx prisma`는 `prisma.config.ts`를 인식 못 할 수 있어요.

---

## Prisma가 생성하는 타입들

`pnpm prisma generate` 후 사용 가능한 TypeScript 타입들:

```typescript
import { Admin, AdminRole } from '@prisma/client';

// Admin 타입 (admin.prisma 기반으로 자동 생성)
type Admin = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  failCount: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

// AdminRole enum
enum AdminRole {
  관리자 = '관리자',
  최고관리자 = '최고관리자',
}
```

이 타입들은 `prisma.admin.findMany()` 같은 쿼리 결과의 타입으로 자동 사용돼요.

---

## 전체 Prisma 흐름 요약

```
admin.prisma (스키마 정의)
    ↓ pnpm prisma migrate dev
DB 테이블 생성 (PostgreSQL)
    ↓ pnpm prisma generate
TypeScript 타입 생성 (node_modules/@prisma/client)
    ↓
PrismaService (prisma.service.ts)
    ↓ extends PrismaClient
prisma.admin.findMany()   → SELECT * FROM Admin
prisma.admin.create()     → INSERT INTO Admin VALUES (...)
prisma.admin.findFirst()  → SELECT * FROM Admin WHERE ...
    ↓
AdminService에서 PrismaService 주입받아 사용
```
