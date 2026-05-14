# 학습 가이드 — 어떻게 공부해야 진짜 개발자가 될까?

이 문서는 Nx, NestJS, Angular, Prisma, TypeScript를 단순히 문법만 외우는 게 아니라
**실제로 사용할 수 있는 수준**까지 익히는 방법을 정리한 가이드예요.

---

## 핵심 원칙 — "읽기 → 고치기 → 만들기"

문서를 읽는 것만으로는 절대 실력이 안 늘어요. 반드시 이 3단계를 반복해야 해요.

```text
1단계: 읽기   — 개념 이해 (이 docs 폴더 문서들)
2단계: 고치기 — 기존 코드 수정해보기 (이 프로젝트)
3단계: 만들기 — 처음부터 만들어보기 (새 프로젝트)
```

책만 읽고 수영을 배울 수 없듯이, 문서만 읽고 개발을 배울 수 없어요.
**반드시 코드를 직접 쳐보고 에러를 만나고 고쳐보는 경험이 필요해요.**

### docs 폴더 문서는 어떤 용도인가요?

docs 폴더의 문서들은 크게 두 가지로 활용해요.

```text
[처음 읽을 때] 개념 입문 — 이게 뭔지 처음 배울 때 읽어요
[작업할 때]   레퍼런스 — 코딩 중에 "이 함수 문법이 뭐였지?" 할 때 펼쳐요
```

처음에는 처음부터 끝까지 읽고, 그 이후에는 필요한 부분만 찾아보는 사전처럼 활용해요.
모든 내용을 외울 필요 없어요. **"이런 게 있다"는 걸 알고, 필요할 때 찾을 줄 알면 돼요.**

---

## 학습 순서

---

### 0단계 — TypeScript 먼저 (모든 것의 기반)

TypeScript를 모르면 NestJS, Angular 코드가 이해가 안 돼요.
다른 것들을 시작하기 전에 TypeScript를 먼저 익히세요.

#### 어떤 문서를 읽어야 하나요?

아래 순서대로 읽으세요. 앞의 것을 알아야 뒤의 것이 이해돼요.

| 순서 | 문서 | 왜 이 순서인가 |
| --- | --- | --- |
| 1 | [기본 타입](./typescript/01-basic-types.md) | `string`, `number` 등 — 가장 기초 |
| 2 | [type vs interface](./typescript/02-type-vs-interface.md) | 객체 타입 정의 방법 2가지 |
| 3 | [유니온 타입](./typescript/03-union-types.md) | `string \| null` — 프로젝트 곳곳에 나옴 |
| 4 | [옵셔널과 단언 연산자](./typescript/04-optional-assertion.md) | `?.`, `??`, `!` — 모르면 코드 읽기 불가 |
| 5 | [제네릭](./typescript/05-generics.md) | `Promise<T>`, `signal<T>()` 이해에 필요 |
| 6 | [유틸리티 타입](./typescript/06-utility-types.md) | `Partial`, `Omit` — DTO 작성 시 필요 |
| 7 | [타입 가드](./typescript/07-type-guard.md) | null 체크 패턴 이해 |
| 8 | [클래스와 접근 제한자](./typescript/08-class-access.md) | `private readonly` — NestJS 코드에 항상 나옴 |
| 9 | [데코레이터](./typescript/10-decorators.md) | `@Injectable`, `@Get` 이해 — NestJS/Angular 입문 전에 필수 |

나머지 문서 ([열거형](./typescript/09-enum.md), [타입 단언](./typescript/11-type-assertion.md), [교차 타입](./typescript/12-intersection-types.md), [타입 추론](./typescript/13-type-inference.md))는
나중에 코딩하다가 모르는 게 생기면 그때 찾아보세요.

#### 이 프로젝트 코드로 실습하는 방법

```text
1. apps/server/src/admins/admin.controller.ts 열기
   → @Controller, @Get, @Post, @Body 등 데코레이터 보임
   → [데코레이터 문서] 읽고 나서 "이게 이 의미였구나" 확인

2. libs/api-client/src/types.gen.ts 열기
   → AdminDto 타입 보임 (role: '관리자' | '최고관리자')
   → [유니온 타입 문서] + [type vs interface 문서] 읽고 이해

3. apps/server/src/admins/admin.service.ts 열기
   → async findAll(): Promise<Admin[]> 보임
   → [기본 타입 문서]의 비동기 함수 + [제네릭 문서] 읽고 이해

4. apps/admin/src/app/stores/admin.store.ts 열기
   → readonly user = signal<AdminDto | null>(null) 보임
   → [제네릭 문서] + [유니온 타입 문서] 읽고 이해
```

---

### 1단계 — Nx (전체 구조 파악, 하루면 충분)

Nx는 "왜 이런 구조로 되어 있지?"를 이해하는 게 목적이에요.
깊게 팔 필요 없고, 전체 그림을 이해하는 수준이면 충분해요.

#### 어떤 문서를 읽어야 하나요?

| 문서 | 읽는 목적 |
| --- | --- |
| [nx.json — Nx의 두뇌](./nx/01-nx-json.md) | `pnpm nx serve`가 어떻게 동작하는지 이해 |
| [tsconfig.base.json](./nx/02-tsconfig-base.md) | `@api-client` import가 어떻게 연결되는지 이해 |
| [project.json](./nx/03-project-json.md) | 각 앱(server, admin)의 빌드 설정 이해 |
| [package.json](./nx/04-package-json.md) | `pnpm generate:api` 같은 스크립트 이해 |

#### 코드 보면서 문서 활용하는 방법

```text
1. 터미널에서 pnpm nx serve server 실행
   → "이게 어떻게 동작하지?" 궁금하면 [nx.json 문서] 열기
   → nx.json의 targetDefaults 섹션이 실행 방식을 결정함

2. apps/admin/src/app/services/admin.service.ts 열기
   → import { adminControllerFindAll } from '@api-client' 보임
   → "@api-client가 어떻게 연결되지?" 궁금하면 [tsconfig.base.json 문서] 열기
   → paths 설정에서 libs/api-client를 가리킴을 확인

3. pnpm generate:api 명령어 실행해보기
   → "이게 뭘 하는 명령어지?" 궁금하면 [package.json 문서] 열기
   → scripts 섹션에 설명 있음
```

**직접 해볼 것:**

```bash
# 의존성 그래프 시각화 — 프로젝트 간 관계가 한눈에 보여요
pnpm nx graph

# 서버 프로젝트가 어떤 작업들을 할 수 있는지 확인
pnpm nx show project server

# admin 프로젝트 정보 확인
pnpm nx show project admin
```

---

### 2단계 — NestJS (백엔드 핵심, 가장 중요)

NestJS는 가장 깊이 파야 하는 부분이에요.
실무에서도, 면접에서도 가장 많이 다루는 영역이에요.

#### 어떤 문서를 읽어야 하나요?

| 문서 | 읽는 목적 | 우선순위 |
| --- | --- | --- |
| [서버 시작점](./nestjs/01-main-ts.md) | 서버가 어떻게 켜지는지 이해 | 보통 |
| [모듈 시스템](./nestjs/02-modules.md) | 구조의 핵심 — 의존성 주입 이해 | **높음** |
| [서비스와 컨트롤러](./nestjs/03-service-controller.md) | HTTP 요청이 처리되는 흐름 | **높음** |
| [DTO 패턴](./nestjs/04-dto-pattern.md) | 데이터 검증과 비밀번호 숨김 방법 | **높음** |
| [Prisma 스키마](./nestjs/05-prisma.md) | DB 연결과 모델 정의 | 보통 |

#### 작업별로 어떤 문서를 열면 되나요?

코딩 중에 막히면 아래 표를 보고 해당 문서를 찾아보세요.

| 막히는 상황 | 열어볼 문서 | 찾아볼 섹션 |
| --- | --- | --- |
| 새 엔드포인트를 만들려는데 어떻게 하지? | [서비스와 컨트롤러](./nestjs/03-service-controller.md) | `@Get`, `@Post` 사용법 |
| DTO에 유효성 검사를 붙이고 싶어 | [DTO 패턴](./nestjs/04-dto-pattern.md) | class-validator 데코레이터 목록 |
| 비밀번호를 응답에서 빼고 싶어 | [DTO 패턴](./nestjs/04-dto-pattern.md) | `@Exclude`, `@Expose` 섹션 |
| 다른 서비스를 이 서비스에서 쓰고 싶어 | [모듈 시스템](./nestjs/02-modules.md) | 의존성 주입 섹션 |
| PrismaService를 어디서나 쓰고 싶어 | [모듈 시스템](./nestjs/02-modules.md) | `@Global()` 섹션 |
| 서버 시작 시 자동으로 뭔가 실행하고 싶어 | [모듈 시스템](./nestjs/02-modules.md) | `OnModuleInit` 섹션 |
| Swagger 문서에 설명을 추가하고 싶어 | [DTO 패턴](./nestjs/04-dto-pattern.md) | `@ApiProperty` 섹션 |

#### 4주 NestJS 학습 계획 (문서 활용 포함)

**1주차 — 구조 이해**

```text
목표: 기존 코드 흐름을 완전히 파악하기

할 일:
1. [모듈 시스템 문서] 읽기
2. apps/server/src/app.module.ts 열고 문서와 대조
3. apps/server/src/admins/ 폴더 파일들 전부 열기
4. GET /admins 요청이 어디서 시작해서 어디서 끝나는지 코드 추적

확인 질문 (이것을 설명할 수 있어야 1주차 완료):
→ AdminController는 AdminService를 어떻게 사용하나요?
→ PrismaService는 어떻게 AdminService에 들어오나요?
→ @Global()을 왜 PrismaModule에만 붙였나요?
```

**2주차 — DTO 만들기**

```text
목표: 관리자 생성 API 만들기

참고 문서:
- [DTO 패턴 문서] — CreateAdminDTO 만드는 방법
- [서비스와 컨트롤러 문서] — @Post 엔드포인트 추가 방법
- [TypeScript 유틸리티 타입 문서] — Omit<AdminDto, 'id'|'createdAt'> 패턴

할 일:
1. CreateAdminDTO 클래스 만들기 (email, name, password 필드)
2. class-validator 데코레이터 붙이기 (@IsEmail, @MinLength 등)
3. AdminController에 POST /admins 엔드포인트 추가
4. AdminService에 create() 메서드 추가
5. 이미 있는 이메일로 가입하면 에러 발생 → P2002 처리
   ([Prisma 에러 처리 문서] 참고)
```

**3주차 — Prisma 쿼리 직접 짜기**

```text
목표: 수정/삭제 API 만들기, LoginLog 기록 추가

참고 문서:
- [Prisma 쿼리 함수 문서] — update, delete 문법 (레퍼런스로 활용)
- [Prisma 관계 문서] — LoginLog ↔ Admin 1:N 관계 정의
- [Prisma 에러 처리 문서] — 없는 id로 수정 시 P2025 처리

할 일:
1. PATCH /admins/:id 엔드포인트 (UpdateAdminDTO 사용)
2. DELETE /admins/:id 엔드포인트 (deletedAt 소프트 삭제)
3. LoginLog 모델 스키마 추가 → 마이그레이션
4. 로그인 성공/실패 시 LoginLog 기록

[Prisma 쿼리 문서]는 함수 목록과 예시가 정리되어 있어요.
쿼리 짜다가 막히면 해당 함수 예시를 찾아보세요.
```

**4주차 — 인증 추가 (이 프로젝트에 없는 부분 → 직접 만들기)**

```text
목표: JWT 인증 추가

참고 문서:
- [TypeScript 타입 가드 문서] — Guard에서 토큰 검증 후 타입 좁히기
- [TypeScript 클래스 접근 제한자 문서] — AuthGuard 클래스 구조

할 일:
1. JWT 토큰 발급 (로그인 성공 시 토큰 반환)
2. AuthGuard 만들기 (토큰 검증)
3. @UseGuards(AuthGuard) 로 보호할 엔드포인트 지정
4. 권한 체크 (최고관리자만 삭제 가능 등)
```

---

### 3단계 — Prisma (NestJS와 함께 학습)

Prisma는 별도로 공부하기보다 NestJS 실습을 하면서 자연스럽게 익히는 게 좋아요.

#### 어떤 문서를 읽어야 하나요?

| 문서 | 활용 방법 |
| --- | --- |
| [Prisma 스키마 정의](./nestjs/05-prisma.md) | 처음 읽을 때 — 스키마 구조와 마이그레이션 개념 이해 |
| [Prisma 쿼리 함수](./nestjs/06-prisma-queries.md) | **레퍼런스** — 쿼리 짜다가 막히면 찾아보기 |
| [Prisma 관계](./nestjs/07-prisma-relations.md) | 새 모델 추가할 때 — 1:N, N:M 관계 정의 방법 |
| [Prisma 에러 처리](./nestjs/08-prisma-errors.md) | 에러 났을 때 — P2002, P2025 처리 방법 |

#### 작업별로 어떤 문서를 열면 되나요?

| 막히는 상황 | 열어볼 문서 | 찾아볼 섹션 |
| --- | --- | --- |
| `findMany`에 조건 걸고 싶어 | [쿼리 함수 문서](./nestjs/06-prisma-queries.md) | where 조건 섹션 |
| `contains`, `gt`, `in` 어떻게 쓰지? | [쿼리 함수 문서](./nestjs/06-prisma-queries.md) | where 연산자 표 |
| 여러 작업을 하나로 묶고 싶어 (트랜잭션) | [쿼리 함수 문서](./nestjs/06-prisma-queries.md) | `$transaction` 섹션 |
| 새 모델 추가하고 기존 모델과 연결하고 싶어 | [관계 문서](./nestjs/07-prisma-relations.md) | 1:N 관계 섹션 |
| DB 에러 코드를 NestJS 에러로 변환하고 싶어 | [에러 처리 문서](./nestjs/08-prisma-errors.md) | 에러 코드 매핑 표 |
| 스키마를 바꾸고 DB에 반영하고 싶어 | [스키마 정의 문서](./nestjs/05-prisma.md) | 마이그레이션 섹션 |

**반드시 직접 해볼 것:**

```bash
# 스키마 수정 후 마이그레이션 직접 해보기
pnpm prisma migrate dev --name add-login-log

# Prisma Studio로 DB 데이터 직접 보기 (시각적으로 확인)
pnpm prisma studio
```

---

### 4단계 — Angular (가볍게 시작, 점점 깊게)

Angular는 학습 곡선이 높아요. 처음엔 "어떻게 동작하는지"만 파악하고,
직접 기능을 추가하면서 배우는 게 효율적이에요.

#### 어떤 문서를 읽어야 하나요?

| 문서 | 읽는 목적 | 우선순위 |
| --- | --- | --- |
| [앱 시작점](./angular/01-bootstrap.md) | Angular 앱이 어떻게 시작되는지 이해 | 보통 |
| [라우팅](./angular/02-routing.md) | 새 페이지 추가하는 방법 이해 | **높음** |
| [Signal 상태관리](./angular/03-signals-store.md) | 데이터를 화면에 연결하는 방법 이해 | **높음** |
| [API 클라이언트](./angular/04-api-client.md) | 서버 API를 호출하는 방법 이해 | **높음** |

#### 작업별로 어떤 문서를 열면 되나요?

| 막히는 상황 | 열어볼 문서 | 찾아볼 섹션 |
| --- | --- | --- |
| 새 페이지(컴포넌트) 추가하고 싶어 | [라우팅 문서](./angular/02-routing.md) | `loadComponent` 섹션 |
| URL로 페이지 이동하고 싶어 | [라우팅 문서](./angular/02-routing.md) | `router.navigate` 섹션 |
| 서버에서 데이터 받아서 화면에 표시하고 싶어 | [API 클라이언트 문서](./angular/04-api-client.md) | 사용 예시 섹션 |
| 화면 여러 곳에서 같은 데이터를 공유하고 싶어 | [Signal 상태관리 문서](./angular/03-signals-store.md) | AdminStore 구조 섹션 |
| signal, computed의 차이가 뭐지? | [Signal 상태관리 문서](./angular/03-signals-store.md) | computed 섹션 |
| API 자동 생성 후 타입이 어디에 생기지? | [API 클라이언트 문서](./angular/04-api-client.md) | types.gen.ts 섹션 |
| API 응답의 타입이 뭔지 모르겠어 | [API 클라이언트 문서](./angular/04-api-client.md) + [TypeScript 타입 추론 문서](./typescript/13-type-inference.md) | - |

#### 이 프로젝트에서 직접 해볼 것들

```text
1. 관리자 목록 페이지 만들기
   → [라우팅 문서]에서 새 route 추가 방법 확인
   → [API 클라이언트 문서]에서 adminControllerFindAll 사용 방법 확인
   → [Signal 상태관리 문서]에서 signal([])로 목록 상태 만드는 방법 확인

2. 관리자 상세 페이지 만들기
   → [라우팅 문서]에서 :id 파라미터 받는 방법 확인

3. 로그아웃 기능 추가
   → [Signal 상태관리 문서]에서 AdminStore.clearUser() 패턴 확인

4. 관리자 생성 폼 만들기
   → [API 클라이언트 문서]에서 adminControllerCreate 호출 방법 확인
```

---

## 전체 4주 통합 학습 계획 (docs 활용 포함)

NestJS + Angular를 함께 배우면서 기능을 하나씩 완성하는 방식이에요.
기능 하나를 완성하면 백엔드/프론트엔드 양쪽을 모두 경험하게 돼요.

### 1주차 — 관리자 목록 조회 (코드 읽기)

**목표:** 기존 코드 흐름 파악 — "코드가 어떻게 연결되는지" 이해

```text
[백엔드]
- apps/server/src/admins/ 전체 코드 읽기
- GET /admins 엔드포인트 코드 추적

[프론트]
- apps/admin/src/ 전체 구조 파악
- 로그인 후 화면에 뭐가 표시되는지 확인

[DB]
- pnpm prisma studio 실행해서 데이터 직접 보기
```

**이 주에 활용할 docs:**

| 읽는 순서 | 문서 | 읽는 이유 |
| --- | --- | --- |
| 1 | [모듈 시스템](./nestjs/02-modules.md) | AdminModule 구조 이해 |
| 2 | [서비스와 컨트롤러](./nestjs/03-service-controller.md) | 코드 흐름 이해 |
| 3 | [Prisma 스키마](./nestjs/05-prisma.md) | Admin 모델 필드 이해 |
| 4 | [Signal 상태관리](./angular/03-signals-store.md) | AdminStore 코드 이해 |
| 5 | [API 클라이언트](./angular/04-api-client.md) | 자동 생성 코드 이해 |

---

### 2주차 — 관리자 생성 (처음 만들어보기)

**목표:** POST /admins 엔드포인트 + Angular 생성 폼

```text
[백엔드]
- CreateAdminDTO 만들기
- POST /admins 엔드포인트 추가
- 중복 이메일 에러 처리

[프론트]
- 관리자 생성 폼 컴포넌트
- POST API 호출
- 성공 시 목록으로 이동
```

**이 주에 활용할 docs:**

| 작업 | 참고 문서 | 찾아볼 내용 |
| --- | --- | --- |
| DTO 만들기 | [DTO 패턴](./nestjs/04-dto-pattern.md) | class-validator 데코레이터 목록 |
| Swagger에 타입 반영 | [DTO 패턴](./nestjs/04-dto-pattern.md) | @ApiProperty 사용법 |
| DB에 저장하기 | [Prisma 쿼리 함수](./nestjs/06-prisma-queries.md) | `create` 함수 문법 |
| 중복 에러 처리 | [Prisma 에러 처리](./nestjs/08-prisma-errors.md) | P2002 처리 패턴 |
| 새 라우트 추가 | [Angular 라우팅](./angular/02-routing.md) | `loadComponent` 패턴 |
| API 호출 | [API 클라이언트](./angular/04-api-client.md) | 함수 호출 패턴 |
| DTO 수정 후 타입 재생성 | [API 클라이언트](./angular/04-api-client.md) | `pnpm generate:api` |

---

### 3주차 — 관리자 수정/삭제 (CRUD 완성)

**목표:** PATCH, DELETE 엔드포인트 + Angular 화면

```text
[백엔드]
- UpdateAdminDTO (Partial 패턴)
- PATCH /admins/:id 엔드포인트
- DELETE /admins/:id (소프트 삭제)
- LoginLog 모델 추가 + 로그인 기록

[프론트]
- 수정 폼 (기존 값 불러와서 채우기)
- 삭제 버튼 + 확인 다이얼로그
```

**이 주에 활용할 docs:**

| 작업 | 참고 문서 | 찾아볼 내용 |
| --- | --- | --- |
| 일부만 수정 가능한 DTO | [TypeScript 유틸리티 타입](./typescript/06-utility-types.md) | `Partial<T>` 패턴 |
| DB 데이터 수정 | [Prisma 쿼리 함수](./nestjs/06-prisma-queries.md) | `update`, `updateMany` 문법 |
| 소프트 삭제 구현 | [Prisma 쿼리 함수](./nestjs/06-prisma-queries.md) | `update` + deletedAt |
| 없는 id로 수정 시 에러 | [Prisma 에러 처리](./nestjs/08-prisma-errors.md) | P2025 처리 패턴 |
| LoginLog 모델 추가 | [Prisma 관계](./nestjs/07-prisma-relations.md) | 1:N 관계 정의 방법 |
| LoginLog 마이그레이션 | [Prisma 스키마](./nestjs/05-prisma.md) | 마이그레이션 명령어 |

---

### 4주차 — 인증 강화 (심화)

**목표:** JWT 인증 추가 + 권한 체크

```text
[백엔드]
- 로그인 성공 시 JWT 토큰 발급
- AuthGuard 만들기 (모든 요청에 토큰 검사)
- 최고관리자만 삭제 가능하도록 권한 체크

[프론트]
- localStorage에 토큰 저장
- 모든 API 요청에 토큰 자동 첨부
- 토큰 만료 시 로그인 페이지로 이동
```

**이 주에 활용할 docs:**

| 작업 | 참고 문서 | 찾아볼 내용 |
| --- | --- | --- |
| Guard 클래스 구조 | [TypeScript 클래스 접근 제한자](./typescript/08-class-access.md) | class 구조 패턴 |
| 토큰에서 사용자 정보 꺼내기 | [TypeScript 타입 가드](./typescript/07-type-guard.md) | `instanceof` 패턴 |
| Guard에서 타입 단언 | [TypeScript 타입 단언](./typescript/11-type-assertion.md) | `as` 사용법 |
| 역할(role) 비교 | [TypeScript 열거형 문서](./typescript/09-enum.md) | Prisma enum 사용법 |
| 권한별 분기 | [TypeScript 유니온 타입](./typescript/03-union-types.md) | 리터럴 유니온 패턴 |

---

## 문서 활용 지도 — 상황별 빠른 찾기

코딩 중에 막힐 때 바로 찾을 수 있는 표예요.

### TypeScript 관련

| 상황 | 문서 |
| --- | --- |
| 타입을 어떻게 선언하지? | [기본 타입](./typescript/01-basic-types.md) |
| type 써야 해? interface 써야 해? | [type vs interface](./typescript/02-type-vs-interface.md) |
| null일 수도 있는 값 안전하게 쓰고 싶어 | [옵셔널과 단언 연산자](./typescript/04-optional-assertion.md) |
| 타입을 재활용해서 새 타입 만들고 싶어 | [유틸리티 타입](./typescript/06-utility-types.md) |
| union 타입인데 특정 타입인지 확인하고 싶어 | [타입 가드](./typescript/07-type-guard.md) |
| 이 함수 반환 타입을 자동으로 가져오고 싶어 | [타입 추론](./typescript/13-type-inference.md) |
| 여러 타입의 속성을 하나로 합치고 싶어 | [교차 타입](./typescript/12-intersection-types.md) |

### NestJS 관련

| 상황 | 문서 |
| --- | --- |
| 새 모듈/서비스/컨트롤러 만들고 싶어 | [서비스와 컨트롤러](./nestjs/03-service-controller.md) |
| 다른 서비스를 주입받아서 쓰고 싶어 | [모듈 시스템](./nestjs/02-modules.md) |
| 요청 데이터 유효성 검사하고 싶어 | [DTO 패턴](./nestjs/04-dto-pattern.md) |
| Swagger에 API 문서 만들고 싶어 | [DTO 패턴](./nestjs/04-dto-pattern.md) |

### Prisma 관련

| 상황 | 문서 |
| --- | --- |
| DB 조회/생성/수정/삭제 문법이 뭐지? | [Prisma 쿼리 함수](./nestjs/06-prisma-queries.md) |
| 두 모델을 연결하고 싶어 | [Prisma 관계](./nestjs/07-prisma-relations.md) |
| DB 에러를 HTTP 에러로 바꾸고 싶어 | [Prisma 에러 처리](./nestjs/08-prisma-errors.md) |
| 스키마 바꾸고 DB에 반영하고 싶어 | [Prisma 스키마](./nestjs/05-prisma.md) |

### Angular 관련

| 상황 | 문서 |
| --- | --- |
| 새 페이지 추가하고 싶어 | [라우팅](./angular/02-routing.md) |
| 화면 여러 곳에서 데이터 공유하고 싶어 | [Signal 상태관리](./angular/03-signals-store.md) |
| 서버 API 호출하고 싶어 | [API 클라이언트](./angular/04-api-client.md) |
| API 타입이 업데이트됐는데 어떻게 하지? | [API 클라이언트](./angular/04-api-client.md) |

---

## 공부할 때 자주 하는 실수

### 실수 1: 문서만 읽고 "이해했다"고 착각

```text
❌ 문서 읽기 → 이해한 것 같음 → 다음으로 넘어감
✅ 문서 읽기 → 코드에서 찾기 → 직접 바꿔보기 → 진짜 이해
```

### 실수 2: 에러를 피하려고 함

```text
❌ 에러 나지 않도록 조심스럽게 코딩
✅ 일부러 에러를 내보고 → 에러 메시지 읽기 → 고치기
   (에러 메시지를 읽는 능력이 실력의 핵심이에요)
```

### 실수 3: 완전히 이해하고 나서 넘어가려 함

```text
❌ 이 개념을 100% 이해하면 다음으로...
✅ 70% 이해했으면 일단 써보기 → 쓰다 보면 나머지 30% 이해됨
   (코딩은 완전히 이해하고 시작하는 게 아니에요)
```

### 실수 4: 구글링/AI를 너무 빨리 사용

```text
❌ 막히면 바로 검색 또는 AI에게 물어보기
✅ 5분은 스스로 생각해보기 → 그래도 모르면 검색/질문
   (스스로 생각하는 시간이 실력을 만들어요)
```

---

## 공식 문서 — 더 깊이 공부하고 싶을 때

이 docs 폴더는 "이 프로젝트 코드를 이해하는 입문서"예요.
더 깊이 공부하고 싶으면 공식 문서를 함께 보세요.

| 기술 | 공식 문서 | 추천 섹션 |
| --- | --- | --- |
| NestJS | docs.nestjs.com | First Steps → Controllers → Providers → Modules 순서로 |
| Prisma | prisma.io/docs | Getting Started → CRUD → Relations |
| Angular | angular.dev | Tutorial (따라하기 가장 좋음) |
| TypeScript | typescriptlang.org/docs/handbook | Everyday Types → Functions → Object Types |
| Nx | nx.dev/getting-started | 개념 이해 수준으로만 |

---

## 학습 수준 체크리스트

아래 항목들을 "설명할 수 있다"면 해당 기술을 제대로 이해한 거예요.

### TypeScript

- [ ] `type`과 `interface`의 차이를 설명할 수 있다
- [ ] `?`, `?.`, `??`, `!`의 차이를 코드로 보여줄 수 있다
- [ ] 제네릭이 왜 필요한지 예시로 설명할 수 있다
- [ ] `Partial<T>`, `Omit<T, K>`, `Pick<T, K>`를 실제로 사용할 수 있다
- [ ] 타입 가드가 뭔지 설명하고 직접 작성할 수 있다

### NestJS

- [ ] 모듈/서비스/컨트롤러의 역할 차이를 설명할 수 있다
- [ ] 의존성 주입(DI)이 무엇인지 설명할 수 있다
- [ ] DTO가 왜 필요한지, `@Exclude`/`@Expose`가 뭔지 설명할 수 있다
- [ ] CRUD 엔드포인트를 처음부터 혼자 만들 수 있다
- [ ] Prisma 에러 코드 P2002, P2025를 처리할 수 있다

### Prisma

- [ ] `findMany`, `findFirst`, `findUnique`의 차이를 설명할 수 있다
- [ ] 1:N 관계를 스키마로 정의하고 쿼리할 수 있다
- [ ] 마이그레이션을 직접 만들고 실행할 수 있다
- [ ] `$transaction`이 왜 필요한지 설명할 수 있다

### Angular

- [ ] Signal이 뭔지, 왜 쓰는지 설명할 수 있다
- [ ] 새 라우트(페이지)를 추가할 수 있다
- [ ] API를 호출하고 결과를 화면에 표시할 수 있다
- [ ] `signal()`, `computed()`, `effect()`의 차이를 설명할 수 있다

### Nx

- [ ] `pnpm nx serve`, `pnpm nx build`가 무엇을 하는지 설명할 수 있다
- [ ] `@api-client` import가 어떻게 연결되는지 설명할 수 있다
- [ ] `apps/`와 `libs/`의 차이를 설명할 수 있다
