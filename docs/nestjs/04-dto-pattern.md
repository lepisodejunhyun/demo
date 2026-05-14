# DTO 패턴 — 데이터 검증과 직렬화

**파일 위치:**
- `apps/server/src/app/admin/dtos/admin.dto.ts`
- `apps/server/src/app/admin/dtos/admin-sign-in.dto.ts`

---

## DTO란 무엇인가?

DTO는 **Data Transfer Object(데이터 전송 객체)**의 약자예요.

클라이언트(브라우저)와 서버가 데이터를 주고받을 때 **"어떤 형태의 데이터를 주고받을지"** 정의하는 설계도예요.

이 프로젝트에서 DTO를 두 가지 목적으로 사용해요:

1. **요청 DTO** (`AdminSignInDTO`) — 클라이언트에서 오는 데이터를 검증
2. **응답 DTO** (`AdminDTO`) — 서버에서 클라이언트로 보내는 데이터를 정제(민감 정보 제거)

---

## AdminSignInDTO — 요청 데이터 검증

**파일:** `apps/server/src/app/admin/dtos/admin-sign-in.dto.ts`

```typescript
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEmail, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class AdminSignInDTO {
  @ApiProperty({ description: '관리자 이메일' })
  @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({ description: '관리자 비밀번호' })
  @IsNotEmpty({ message: '비밀번호는 필수 입력 항목입니다.' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(20, { message: '비밀번호는 최대 20자 이하이어야 합니다.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"])/, {
    message: '비밀번호는 영문, 숫자, 특수문자가 모두 포함되어야 합니다.',
  })
  password: string;
}
```

---

### `class-validator` 데코레이터들

`class-validator` 라이브러리는 클래스 속성에 검증 규칙을 데코레이터로 붙일 수 있게 해줘요.

`main.ts`에서 `ValidationPipe`를 전역으로 설정했기 때문에, 이 데코레이터들이 자동으로 작동해요.

---

**`@IsNotEmpty()`**

```typescript
@IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
email: string;
```

빈 값(`""`, `null`, `undefined`)을 허용하지 않아요.

```
이메일 없이 요청:  { "password": "abc123!@#" }
→ 400 Bad Request
→ message: "이메일은 필수 입력 항목입니다."
```

---

**`@IsEmail()`**

```typescript
@IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
email: string;
```

이메일 형식인지 확인해요.

```
"test@example.com"    → 통과
"testexample.com"     → 실패 (@ 없음)
"test@"               → 실패 (도메인 없음)
```

---

**`@MinLength()`, `@MaxLength()`**

```typescript
@MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
@MaxLength(20, { message: '비밀번호는 최대 20자 이하이어야 합니다.' })
password: string;
```

문자열 길이를 제한해요.

```
"abc123!"   → 실패 (7자, 8자 미만)
"abc123!@"  → 통과 (8자)
"abcdefghij12345678901"  → 실패 (21자, 20자 초과)
```

---

**`@Matches()`**

```typescript
@Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[\{\}\[\]\/?.,...])/, {
  message: '비밀번호는 영문, 숫자, 특수문자가 모두 포함되어야 합니다.',
})
password: string;
```

정규식(RegEx) 패턴에 맞는지 확인해요.

```
정규식 분해:
  ^         → 문자열 시작
  (?=.*[A-Za-z])  → 영문자가 최소 1개 포함 (lookahead)
  (?=.*\d)        → 숫자가 최소 1개 포함
  (?=.*[특수문자]) → 특수문자가 최소 1개 포함

"abc12345"      → 실패 (특수문자 없음)
"abc!@#$%"      → 실패 (숫자 없음)
"12345!@#$"     → 실패 (영문자 없음)
"abc123!@#"     → 통과 (세 조건 모두 충족)
```

---

### `@ApiProperty()` — Swagger 문서화

```typescript
@ApiProperty({ description: '관리자 이메일' })
email: string;
```

Swagger UI에 이 필드에 대한 설명을 표시해요. 또한 `pnpm generate:api`로 TypeScript 타입을 자동 생성할 때 이 정보가 반영돼요.

생성된 타입 (`libs/api-client/src/types.gen.ts`):
```typescript
export type AdminSignInDto = {
  /** 관리자 이메일 */
  email: string;
  /** 관리자 비밀번호 */
  password: string;
};
```

---

## AdminDTO — 응답 데이터 정제

**파일:** `apps/server/src/app/admin/dtos/admin.dto.ts`

```typescript
import { ApiProperty } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class AdminDTO {
  @ApiProperty({ description: '관리자 고유 식별자' })
  @Expose()
  id: string;

  @ApiProperty({ description: '이메일(로그인ID)' })
  @Expose()
  email: string;

  @ApiProperty({ description: '관리자 이름' })
  @Expose()
  name: string;

  @ApiProperty({ description: '관리자 권한 등급', enum: AdminRole })
  @Expose()
  role: AdminRole;

  @ApiProperty({ description: '연속 로그인 실패 횟수' })
  @Expose()
  failCount: number;

  @ApiProperty({ description: '관리자 계정 잠김 시간' })
  @Expose()
  lockedUntil: Date | null;

  @ApiProperty({ description: '관리자 계정 마지막 로그인 시간', nullable: true })
  @Expose()
  lastLoginAt: Date | null;

  @ApiProperty({ description: '관리자 계정 생성 시간' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: '관리자 계정 수정 시간' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: '관리자 계정 삭제 시간', nullable: true })
  @Expose()
  deletedAt: Date | null;
}
```

**여기에 `password` 필드가 없어요!** 이게 핵심이에요.

---

### `@Exclude()` + `@Expose()` 패턴

`class-transformer` 라이브러리가 제공하는 직렬화 패턴이에요.

**클래스 레벨의 `@Exclude()`**

```typescript
@Exclude()
export class AdminDTO { ... }
```

기본적으로 **모든 속성을 제외**해요.

**`@Expose()`**

```typescript
@Expose()
id: string;

@Expose()
email: string;
```

`@Expose()`를 붙인 속성만 **포함**해요.

**결과:** 명시적으로 `@Expose()`를 붙인 것만 응답에 포함됨.

---

### `plainToInstance()` 동작 원리

컨트롤러에서:

```typescript
const admin = await this.adminService.findAll();
return plainToInstance(AdminDTO, admins);
```

**단계별 동작:**

```
1. DB에서 가져온 Admin 객체 (Prisma 타입):
{
  id: "uuid-123",
  name: "홍길동",
  email: "admin@test.com",
  password: "$2a$10$...",      ← 비밀번호 (암호화됨)
  role: "최고관리자",
  failCount: 0,
  lockedUntil: null,
  lastLoginAt: null,
  createdAt: 2025-01-01,
  updatedAt: 2025-01-01,
  deletedAt: null
}

2. plainToInstance(AdminDTO, admin) 실행:
   - @Exclude() → 일단 모든 필드 제외
   - @Expose() → 표시된 필드만 포함
   - password는 AdminDTO에 없으므로 제외

3. 최종 AdminDTO 객체:
{
  id: "uuid-123",
  name: "홍길동",
  email: "admin@test.com",
  // password가 없음!
  role: "최고관리자",
  failCount: 0,
  lockedUntil: null,
  lastLoginAt: null,
  createdAt: 2025-01-01,
  updatedAt: 2025-01-01,
  deletedAt: null
}
```

---

### Prisma Admin 타입 vs AdminDTO 비교

```
Prisma Admin (DB 스키마 기반)     AdminDTO (응답용)
─────────────────────────────    ─────────────────
id          String               id         (노출)
name        String               name       (노출)
email       String               email      (노출)
password    String ← 존재!        (없음) ← 제거!
role        AdminRole            role       (노출)
failCount   Int                  failCount  (노출)
lockedUntil DateTime?            lockedUntil (노출)
lastLoginAt DateTime?            lastLoginAt (노출)
createdAt   DateTime             createdAt  (노출)
updatedAt   DateTime             updatedAt  (노출)
deletedAt   DateTime?            deletedAt  (노출)
```

---

### `enum: AdminRole` — Swagger에 열거형 표시

```typescript
@ApiProperty({ description: '관리자 권한 등급', enum: AdminRole })
@Expose()
role: AdminRole;
```

`AdminRole`은 Prisma에서 자동 생성된 enum이에요:

```typescript
// @prisma/client에서 생성된 타입
enum AdminRole {
  관리자
  최고관리자
}
```

Swagger 문서에 이 값이 표시되고, 자동 생성된 TypeScript 타입에도 반영돼요:

```typescript
// libs/api-client/src/types.gen.ts
export type AdminDto = {
  role: '관리자' | '최고관리자';  // enum 값들이 union type으로
  ...
}
```

---

## DTO 패턴 전체 요약

```
요청 흐름:
  클라이언트 → AdminSignInDTO
                 ↓ ValidationPipe 자동 검사
                 @IsEmail()        → 이메일 형식
                 @MinLength(8)     → 비밀번호 최소 길이
                 @Matches(정규식)   → 복잡도 요건
                 ↓ 통과하면 Controller로 전달

응답 흐름:
  DB → Admin(password 포함) → plainToInstance(AdminDTO)
                                  ↓
                              @Exclude() → 전체 제외
                              @Expose()  → id, email, name 등만 포함
                                  ↓
                              AdminDTO(password 없음) → 클라이언트
```

**DTO를 쓰는 이유 요약:**

1. **보안** — 비밀번호 같은 민감한 정보를 실수로 보내는 걸 방지
2. **일관성** — 항상 같은 형태의 데이터를 주고받음
3. **자동 검증** — ValidationPipe와 함께 입력 데이터를 자동으로 검사
4. **자동 문서화** — `@ApiProperty()`로 Swagger 문서가 자동 생성됨
5. **타입 안전성** — TypeScript 타입이 자동 생성되어 프론트엔드와 타입 공유
