# JWT 인증 시스템 코드 리뷰

> JWT 인증에 관련된 **서버(NestJS)** 와 **프론트(Angular)** 코드를 한 줄 한 줄 설명하는 문서입니다.

---

## 전체 흐름 요약

```
1. 로그인 → 서버가 Access Token(응답) + Refresh Token(쿠키) 발급
2. API 요청 → Interceptor가 Authorization 헤더에 토큰 자동 첨부
3. 서버 → Guard가 토큰 검증 → 유효하면 통과, 아니면 401
4. 401 받으면 → Interceptor가 감지 → 로그인 페이지로 이동
5. 새로고침 → localStorage에서 토큰 복원
```

---

## 서버 (NestJS)

### 1. JWT Strategy (jwt.strategy.ts)

> "토큰 안에서 사용자 정보를 꺼내 검증하는 역할"

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
```
- `PassportStrategy(Strategy)` → Passport.js의 JWT 전략을 NestJS에서 쓸 수 있게 래핑
- 이 클래스가 **토큰을 받아서 → 유효한지 확인하는** 역할

```typescript
    constructor(private readonly prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'default-secret-key',
        });
    }
```
- `jwtFromRequest` → **어디서 토큰을 찾을지** 설정
  - `ExtractJwt.fromAuthHeaderAsBearerToken()` → `Authorization: Bearer eyJhbG...` 헤더에서 추출
- `ignoreExpiration: false` → 만료된 토큰은 **거부**
- `secretOrKey` → 토큰 서명에 사용한 **비밀 키** (.env의 JWT_SECRET)

```typescript
    async validate(payload: { sub: string; email: string }) {
```
- 토큰이 유효하면 **자동으로 호출**되는 함수
- `payload` → 토큰 안에 들어있던 데이터 (signIn에서 넣은 `{ sub: id, email }`)

```typescript
        const admin = await this.prisma.admin.findFirst({
            where: { id: payload.sub, deletedAt: null },
        });
        if (!admin) throw new UnauthorizedException('유효하지 않은 토큰입니다.');
        return admin;
```
- 토큰 안의 ID로 **실제 DB에서 관리자를 조회**
- 탈퇴한 관리자(`deletedAt`)의 토큰이면 거부
- `return admin` → 이 값이 `req.user`에 들어감 (컨트롤러에서 사용 가능)

---

### 2. JWT Guard (jwt-auth.guard.ts)

> "이 API는 로그인해야 쓸 수 있어!"라고 선언하는 역할

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }
```
- `AuthGuard('jwt')` → 위에서 만든 `JwtStrategy`를 사용하는 **가드**
- 컨트롤러에 `@UseGuards(JwtAuthGuard)`를 붙이면 → 토큰 없는 요청은 **401 에러**

---

### 3. Admin Service — 토큰 발급 (admin.service.ts)

```typescript
    constructor(
        private readonly prisma: PrismaService,
        private readonly eventEmitter: EventEmitter2,
        private readonly jwtService: JwtService,   // ← 새로 추가
    ) { }
```
- `JwtService` → 토큰을 **생성하고 검증**하는 도구 (`@nestjs/jwt` 제공)

```typescript
    async signIn(data: AdminSignInDTO): Promise<{ accessToken: string; refreshToken: string; admin: Admin }> {
```
- 반환값이 바뀜: 기존 `Admin` → `{ accessToken, refreshToken, admin }`

```typescript
        const payload = { sub: admin.id, email: admin.email };
```
- 토큰 안에 넣을 데이터. `sub`는 JWT 표준 필드명 (subject = 주체 = 사용자 ID)

```typescript
        const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
```
- `sign()` → payload를 암호화하여 **JWT 문자열** 생성
- Access Token → **1시간** 후 만료 (API 인증용, 짧은 수명)
- Refresh Token → **7일** 후 만료 (Access Token 재발급용, 긴 수명)

```typescript
    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
        try {
            const payload = this.jwtService.verify(refreshToken);
```
- `verify()` → 토큰이 유효한지 검증. 만료됐거나 위조됐으면 에러 발생

```typescript
            const newPayload = { sub: admin.id, email: admin.email };
            const accessToken = this.jwtService.sign(newPayload, { expiresIn: '1h' });
            return { accessToken };
        } catch {
            throw new UnauthorizedException('Refresh Token이 만료되었습니다.');
        }
```
- 유효하면 → **새 Access Token 발급**
- 만료됐으면 → 401 에러 → 프론트에서 로그인 페이지로 이동

---

### 4. Admin Controller (admin.controller.ts)

#### signin — 로그인

```typescript
    async signin(
        @Body() data: AdminSignInDTO,
        @Res({ passthrough: true }) res: Response,
    ): Promise<SignInResponseDTO> {
```
- `@Res({ passthrough: true })` → Express의 Response 객체에 접근 (쿠키 설정용)
- `passthrough: true` → NestJS가 응답을 자동 처리하도록 허용

```typescript
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });
```
- `httpOnly: true` → **JavaScript로 접근 불가** (XSS 공격 방어의 핵심!)
- `secure: true` → HTTPS에서만 전송 (운영 환경)
- `sameSite: 'strict'` → 다른 사이트에서 이 쿠키를 보내지 못함 (CSRF 방어)
- `maxAge` → 7일 (밀리초 단위: 7 × 24 × 60 × 60 × 1000)
- `path: '/'` → 모든 경로에서 쿠키 사용 가능

```typescript
        return plainToInstance(SignInResponseDTO, { accessToken, admin });
```
- 응답 body로는 `{ accessToken, admin }` 만 보냄 (refreshToken은 쿠키로!)

#### refresh — 토큰 갱신

```typescript
        const refreshToken = req.cookies?.refreshToken;
```
- `req.cookies` → 브라우저가 자동으로 보내는 쿠키에서 refreshToken을 꺼냄
- `?.` → 쿠키가 없으면 에러 대신 `undefined` 반환

#### logout — 로그아웃

```typescript
        res.clearCookie('refreshToken', { ... });
```
- 쿠키를 삭제. 설정할 때와 **동일한 옵션**을 줘야 정상 삭제됨

#### me — 내 정보

```typescript
    @UseGuards(JwtAuthGuard)
    async me(@Req() req: Request): Promise<AdminDTO> {
        return plainToInstance(AdminDTO, req.user);
    }
```
- Guard가 토큰을 검증하고 `req.user`에 관리자 정보를 넣어줌
- 그걸 그대로 DTO로 변환해서 응답

#### 다른 컨트롤러 (notice, faq, event, gallery)

```typescript
@UseGuards(JwtAuthGuard)   // ← 클래스 레벨에 추가
@Controller('notice')
```
- 컨트롤러 전체에 Guard 적용 → **모든 API가 토큰 필수**

---

### 5. Admin Module (admin.module.ts)

```typescript
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'default-secret-key',
            signOptions: { expiresIn: '1h' },
        }),
    ],
```
- `PassportModule` → Passport.js 인증 프레임워크 활성화
- `JwtModule.register()` → JWT 서비스를 설정하고 등록
- `secret` → 토큰 암호화/복호화에 사용하는 **비밀 키**
- `signOptions` → 기본 만료 시간 (개별 호출에서 덮어쓸 수 있음)

```typescript
    exports: [JwtModule, PassportModule],
```
- 다른 모듈에서도 JWT 기능을 쓸 수 있도록 **내보내기**

---

### 6. main.ts — 서버 설정

```typescript
import cookieParser from 'cookie-parser';
```
- 쿠키를 파싱하는 미들웨어. 없으면 `req.cookies`가 `undefined`

```typescript
    app.enableCors({
        origin: 'http://localhost:4200',
        credentials: true,
    });
```
- `origin` → 이 주소에서 오는 요청만 허용 (Angular 개발 서버)
- `credentials: true` → **쿠키를 포함한 요청**을 허용. 이게 없으면 refreshToken 쿠키가 안 옴

```typescript
    app.use(cookieParser());
```
- 모든 요청에서 쿠키를 자동으로 파싱 → `req.cookies`로 접근 가능

---

## 프론트엔드 (Angular)

### 7. Auth Service (auth.service.ts)

> "토큰과 사용자 정보를 localStorage에 저장/조회/삭제하는 도구"

```typescript
const ACCESS_TOKEN_KEY = 'accessToken';
const USER_KEY = 'adminUser';
```
- localStorage에 저장할 때 사용하는 **키 이름**

```typescript
    getToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
```
- `localStorage.getItem()` → 브라우저 저장소에서 값을 가져옴
- 없으면 `null` 반환

```typescript
    setToken(token: string): void {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
```
- `localStorage.setItem()` → 값을 저장. 새로고침해도 유지됨

```typescript
    isLoggedIn(): boolean {
        return !!this.getToken();
    }
```
- 토큰이 있으면 `true`, 없으면 `false`

```typescript
    clear(): void {
        this.removeToken();
        this.removeStoredUser();
    }
```
- 로그아웃 시 **토큰과 사용자 정보 모두 삭제**

---

### 8. Auth Interceptor (auth.interceptor.ts)

> "모든 HTTP 요청에 토큰을 자동으로 붙이고, 401 에러를 감지하는 역할"

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
```
- `HttpInterceptorFn` → Angular의 **함수형 인터셉터**
- `req` → 나가려는 HTTP 요청
- `next` → 다음 단계로 요청을 보내는 함수

```typescript
    const token = authService.getToken();

    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
        });
    }
```
- 토큰이 있으면 → 요청에 `Authorization: Bearer eyJhbG...` 헤더를 **자동 추가**
- `req.clone()` → 요청은 불변(immutable)이라 **복사해서 수정**
- `withCredentials: true` → 쿠키도 함께 전송 (refreshToken용)

```typescript
    return next(req).pipe(
        catchError(error => {
            if (error.status === 401 && !req.url.includes('/signin') && !req.url.includes('/refresh')) {
                authService.clear();
                router.navigate(['/']);
            }
            return throwError(() => error);
        }),
    );
```
- `next(req)` → 요청을 실제로 서버에 보냄
- `.pipe(catchError(...))` → 에러가 발생하면 가로채기
- `error.status === 401` → **인증 실패** (토큰 만료/없음)
- `/signin`, `/refresh`는 제외 → 로그인/갱신 요청의 401은 정상 흐름
- `authService.clear()` → 저장된 토큰/사용자 삭제
- `router.navigate(['/'])` → **루트 경로로 이동** → canMatch가 로그인 화면 표시

---

### 9. Route Guard (auth.guard.ts)

> "페이지 접근 권한을 확인하는 문지기"

#### authGuard — 로그인 필수 페이지 보호

```typescript
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn()) {
        return true;    // 토큰 있음 → 통과
    }

    router.navigate(['/']);
    return false;       // 토큰 없음 → 루트로 (로그인 화면)
};
```
- `/notice`, `/gallery` 등 하위 페이지에서 **토큰 없이 URL 직접 입력 시 차단**

#### guestGuard — 이미 로그인한 사용자 차단

```typescript
export const guestGuard: CanActivateFn = () => {
    if (!authService.isLoggedIn()) {
        return true;    // 미로그인 → 로그인 페이지 보여줌
    }

    router.navigate(['/']);
    return false;       // 이미 로그인 → 루트로 (대시보드)
};
```
- 현재는 `canMatch`로 대체되어 **직접 사용되지 않음** (하위 호환용으로 유지)

---

### 10. app.routes.ts — canMatch로 라우팅

> "같은 URL에서 로그인 상태에 따라 다른 화면을 보여주는 핵심"

```typescript
    {
        path: '',
        pathMatch: 'full',
        canMatch: [() => !inject(AuthService).isLoggedIn()],
        loadComponent: () => import('./pages/auth/sign-in/sign-in.page'),
    },
    {
        path: '',
        component: DefaultLayout,
        canMatch: [() => inject(AuthService).isLoggedIn()],
        children: [
            {
                path: '',   // ← 대시보드도 루트 경로
                loadComponent: () => import('./pages/dashboard/dashboard.page'),
            },
            ...
        ]
    },
```

#### canActivate vs canMatch 차이

| | `canActivate` | `canMatch` |
|---|---|---|
| 동작 | 라우트 매칭 **후** 접근 차단 | 라우트 매칭 **자체를 결정** |
| 실패 시 | 에러 또는 리다이렉트 | **다음 라우트를 시도** |
| URL 변경 | 리다이렉트로 URL 바뀜 | URL 그대로 유지 ✅ |

#### 동작 흐름

```
localhost:4200 접속
    ↓
1번 라우트: canMatch → isLoggedIn() = false → !false = true → 매칭! → 로그인 화면
1번 라우트: canMatch → isLoggedIn() = true  → !true = false → 스킵
    ↓
2번 라우트: canMatch → isLoggedIn() = true → 매칭! → DefaultLayout + 대시보드
```

- **리다이렉트 없이** `localhost:4200` 그대로 유지
- 로그인 안 됨 → 로그인 화면
- 로그인 됨 → 대시보드

---

### 11. app.config.ts — Interceptor 등록

```typescript
    provideHttpClient(withInterceptors([authInterceptor])),
```
- `withInterceptors()` → 인터셉터를 HTTP 클라이언트에 등록
- 이 한 줄로 **모든 HTTP 요청에 토큰이 자동 첨부**됨

---

### 12. sign-in.page.ts — 로그인 처리

```typescript
            const result = await this.api.invoke(adminControllerSignin, { body: { ... } });
```
- 서버에서 `{ accessToken, admin }` 응답 (refreshToken은 쿠키에 자동 저장)

```typescript
            this.authService.setToken(result.accessToken);
            this.authService.setStoredUser(result.admin);
            this.adminStore.setUser(result.admin);
```
- Access Token → localStorage에 저장
- 사용자 정보 → localStorage + AdminStore(signal) 양쪽에 저장
- signal은 새로고침하면 사라지지만, localStorage는 남아있음

---

### 13. admin.store.ts — 상태 복원

```typescript
    private readonly state = signal<{ user: AdminDto | null}>({
        user: this.authService.getStoredUser(),
    });
```
- 앱이 시작될 때 localStorage에서 **자동으로 사용자 정보 복원**
- 새로고침해도 로그인 상태가 유지되는 이유!

```typescript
    clearUser(): void {
        this.state.update(s => ({ ...s, user: null }));
        this.authService.clear();
    }
```
- 로그아웃 시 signal + localStorage **모두 초기화**

---

## 보안 구조 요약

```
                     Access Token (1시간)
                     저장: localStorage
  [Angular]  ──────────────────────────────────►  [NestJS]
             ◄──────────────────────────────────
                     Refresh Token (7일)
                     저장: httpOnly Cookie
                     (JS 접근 불가!)
```

| 공격 | 방어 |
|---|---|
| XSS (악성 스크립트) | Refresh Token은 httpOnly → JS로 못 훔침 |
| CSRF (다른 사이트에서 요청) | sameSite: strict → 다른 사이트에서 쿠키 안 보냄 |
| 토큰 탈취 | Access Token 1시간 만료 → 피해 최소화 |
| URL 직접 접근 | Route Guard가 차단 |
