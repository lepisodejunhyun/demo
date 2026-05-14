# JWT 인증 시스템 구현

관리자 대시보드에 JWT 기반 인증/인가 시스템을 도입합니다. 현재는 로그인 API만 존재하고, 토큰 발급/검증/보호가 전혀 없는 상태입니다.

## 현재 상태 (문제점)

- ✅ 로그인 UI, 비밀번호 검증 (bcrypt) → 이미 구현됨
- ❌ 로그인 성공 후 **토큰 발급 없음** → AdminDTO만 반환
- ❌ API 요청에 **인증 헤더 없음** → 누구나 접근 가능
- ❌ 서버에 **Guard 없음** → 모든 API 비보호 상태
- ❌ 프론트에 **Route Guard 없음** → URL 직접 입력으로 대시보드 접근 가능
- ❌ 새로고침하면 **로그인 상태 초기화** → signal만 사용 (영속성 없음)

## User Review Required

> [!IMPORTANT]
> **토큰 저장 방식 선택이 필요합니다:**
> - **localStorage** — 구현 간단, XSS 공격에 취약
> - **httpOnly Cookie** — 보안 강함, CSRF 대응 필요, 서버 설정 추가
> 
> 관리자 페이지이므로 **localStorage** 방식을 추천합니다 (내부 사용자만 접근). 괜찮으시면 이 방식으로 진행합니다.

> [!IMPORTANT]
> **Refresh Token 구현 여부:**
> - Access Token만 사용 (만료 시 재로그인) → 간단
> - Access + Refresh Token (자동 갱신) → 복잡하지만 UX 좋음
> 
> 1단계로 **Access Token만** 구현하고, 필요 시 Refresh Token을 추가하는 것을 추천합니다.

## Proposed Changes

### 1단계: NestJS 서버 — JWT 모듈 설정

#### [MODIFY] [admin.module.ts](file:///c:/workspace/demo/apps/server/src/app/admin/admin.module.ts)
- `@nestjs/jwt`의 `JwtModule` 등록
- JWT secret, 만료 시간 설정 (환경변수에서 읽기)

#### [MODIFY] [admin.service.ts](file:///c:/workspace/demo/apps/server/src/app/admin/admin.service.ts)
- `signIn` 메서드에서 JWT 토큰 발급 추가
- 반환값: `{ accessToken, admin }` 형태로 변경

#### [MODIFY] [admin.controller.ts](file:///c:/workspace/demo/apps/server/src/app/admin/admin.controller.ts)
- `/signin` 응답에 `accessToken` 포함
- 응답 DTO 변경 (AdminDTO → SignInResponseDTO)

#### [NEW] [sign-in-response.dto.ts](file:///c:/workspace/demo/apps/server/src/app/admin/dtos/sign-in-response.dto.ts)
- `accessToken: string` + `admin: AdminDTO` 필드

---

### 2단계: NestJS 서버 — JWT Guard (API 보호)

#### [NEW] [jwt.strategy.ts](file:///c:/workspace/demo/apps/server/src/app/admin/strategies/jwt.strategy.ts)
- `@nestjs/passport`의 JWT Strategy
- 토큰에서 admin ID 추출 → DB에서 관리자 조회 → request.user에 할당

#### [NEW] [jwt-auth.guard.ts](file:///c:/workspace/demo/apps/server/src/app/admin/guards/jwt-auth.guard.ts)
- `AuthGuard('jwt')` 상속
- 인증 실패 시 401 Unauthorized 응답

#### [MODIFY] 모든 컨트롤러 (notice, faq, event, gallery)
- `@UseGuards(JwtAuthGuard)` 데코레이터 추가
- `/signin` 엔드포인트만 Guard 제외 (로그인은 토큰 없이 접근해야 하므로)

---

### 3단계: Angular 프론트 — 토큰 관리

#### [NEW] [auth.service.ts](file:///c:/workspace/demo/apps/admin/src/app/services/auth.service.ts)
- `localStorage`에 토큰 저장/조회/삭제
- 로그인/로그아웃 로직 집중

#### [NEW] [auth.interceptor.ts](file:///c:/workspace/demo/apps/admin/src/app/interceptors/auth.interceptor.ts)
- 모든 HTTP 요청에 `Authorization: Bearer <token>` 헤더 자동 첨부
- 401 응답 시 → 토큰 삭제 + 로그인 페이지로 이동

#### [MODIFY] [app.config.ts](file:///c:/workspace/demo/apps/admin/src/app/app.config.ts)
- `provideHttpClient(withInterceptors([authInterceptor]))` 등록

#### [MODIFY] [sign-in.page.ts](file:///c:/workspace/demo/apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts)
- 로그인 성공 시 `accessToken`을 `AuthService`로 저장
- `AdminStore`에 사용자 정보 저장

#### [MODIFY] [admin.store.ts](file:///c:/workspace/demo/apps/admin/src/app/stores/admin.store.ts)
- 새로고침 시 `localStorage`에서 사용자 정보 복원
- 로그아웃 시 토큰 + 사용자 정보 모두 삭제

---

### 4단계: Angular 프론트 — Route Guard (페이지 보호)

#### [NEW] [auth.guard.ts](file:///c:/workspace/demo/apps/admin/src/app/guards/auth.guard.ts)
- 토큰이 없으면 `/sign-in`으로 리다이렉트
- 이미 로그인된 상태에서 `/sign-in` 접근 시 `/dashboard`로 리다이렉트

#### [MODIFY] [app.routes.ts](file:///c:/workspace/demo/apps/admin/src/app/app.routes.ts)
- DefaultLayout 경로에 `canActivate: [authGuard]` 추가
- sign-in 경로에 `canActivate: [guestGuard]` 추가 (이미 로그인 시 대시보드로)

---

## 전체 흐름 요약

```
[로그인]
1. 프론트: email/password 전송 → POST /api/admins/signin
2. 서버: bcrypt 검증 → JWT 토큰 발급 → { accessToken, admin } 응답
3. 프론트: accessToken을 localStorage에 저장

[API 요청]
4. 프론트: Interceptor가 자동으로 Authorization 헤더 추가
5. 서버: JwtAuthGuard가 토큰 검증 → 유효하면 통과, 아니면 401

[새로고침]
6. 프론트: localStorage에서 토큰 복원 → AdminStore 초기화

[로그아웃]
7. 프론트: localStorage에서 토큰 삭제 → AdminStore 초기화 → 로그인 페이지로
```

## 패키지 설치

```bash
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm add -D @types/passport-jwt
```

## Verification Plan

### Automated Tests
- 서버 빌드 확인: `pnpm nx build server`
- Admin 빌드 확인: `pnpm nx build admin`

### Manual Verification
1. 로그인 → 토큰 발급 확인 (브라우저 localStorage)
2. 로그인 없이 `/dashboard` 접근 → 로그인 페이지로 리다이렉트 확인
3. 로그인 후 API 호출 → 정상 동작 확인
4. 토큰 삭제 후 API 호출 → 401 에러 + 로그인 페이지로 이동 확인
5. 새로고침 후 로그인 상태 유지 확인
