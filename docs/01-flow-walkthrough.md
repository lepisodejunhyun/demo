# 로그인은 어떻게 일어나는가? — 한 사이클을 끝까지 따라가기

이 문서는 사용자가 관리자 화면에서 **이메일/비밀번호를 입력하고 로그인 버튼을 누르면**, 코드 안에서 어떤 일이 일어나는지 처음부터 끝까지 추적합니다. 개발이 처음이라도 이해할 수 있도록 비유와 함께 설명합니다.

---

## 큰 그림 먼저 — "택배 비유"

코드를 따라가기 전에 큰 그림을 머리에 그려봅시다. 로그인은 **택배 배송과 비슷합니다**.

```
[사용자]                                            [DB(창고)]
   │                                                   ▲
   │ ①입력+버튼 클릭                                   │ ⑥ DB 조회
   ▼                                                   │
[Admin (Angular)] ── ②검증 ──▶ ③HTTP 요청 ──▶ [Server (NestJS)] ──▶ [Prisma (택배기사)]
   ▲                                                                          │
   │                                                                          │
   └──── ⑨화면 갱신 ◀── ⑧응답 받기 ◀── ⑦JSON 응답 만들기 ◀── ④검증⑤비번비교 ──┘
```

- **사용자**: 손님 (택배 보내는 사람)
- **Admin 앱**: 가까운 우체국 (사용자 입력을 받아 포장)
- **Server**: 본부 (포장 검사하고 처리)
- **Prisma**: 택배 기사 (창고에 가서 물건 가져옴)
- **DB**: 창고 (실제 데이터 보관)

이제 1~9단계를 코드와 함께 따라가봅시다.

---

## 단계 1 — 사용자가 화면에서 입력하기

**파일**: [apps/admin/src/app/pages/auth/sign-in/sign-in.page.html](../apps/admin/src/app/pages/auth/sign-in/sign-in.page.html)

사용자가 보는 화면은 HTML 파일에 정의돼 있어요. 거기엔 이메일 입력칸, 비밀번호 입력칸, "로그인" 버튼이 있습니다.

HTML은 화면의 **모양**만 정의하고, 사용자 동작에 반응하는 **로직**은 같은 폴더의 `.ts` 파일에 있어요.

### 비유

HTML = 음식점 메뉴판 (모양)
TS = 주방장 (동작 처리)

손님이 메뉴를 보고 주문(=버튼 클릭)하면, 주방장(.ts 파일의 코드)이 일을 시작합니다.

---

## 단계 2 — Reactive Forms로 입력값 받기

**파일**: [apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts](../apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts)

이 .ts 파일에 폼이 정의돼 있어요:

```ts
form = new FormGroup({
    email: new FormControl('', {
        validators: [
            Validators.required,  // 필수 입력
            Validators.email,     // 이메일 형식이어야 함
        ],
        nonNullable: true,
    }),
    password: new FormControl('', {
        validators: [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(16),
            Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
        ],
        nonNullable: true,
    }),
});
```

### 풀이 (한 줄씩)

- `FormGroup` = 폼 전체 (이메일 + 비밀번호 두 입력칸을 묶는 그릇).
- `FormControl('', { validators: [...] })` = 입력칸 하나. 첫 번째 인자 `''`는 **초기값**(빈 문자열로 시작), `validators`는 **검증 규칙들**.
- `Validators.required` = "비어있으면 안 돼" 규칙.
- `Validators.email` = "이메일 형식(xxx@xxx.xxx)이어야 해" 규칙.
- `Validators.minLength(8)` = "최소 8자" 규칙.
- `Validators.pattern(...)` = "이 정규식과 일치해야 해" 규칙. 영문 + 숫자 + 특수문자 조합 강제.

### HTML과 연결

HTML에서는 이 폼과 입력칸을 이렇게 연결합니다 (sign-in.page.html):
```html
<form [formGroup]="form">
    <input formControlName="email" />
    <input formControlName="password" type="password" />
    <button (click)="submit()">로그인</button>
</form>
```

- `[formGroup]="form"` = "이 form 객체를 사용하겠다"
- `formControlName="email"` = "이 input은 form 안의 email 컨트롤이다"
- `(click)="submit()"` = "버튼을 클릭하면 submit() 함수 실행"

---

## 단계 3 — submit() 함수가 실행됨

사용자가 로그인 버튼을 누르는 순간, [sign-in.page.ts](../apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts)의 `submit()` 함수가 호출돼요.

```ts
async submit() {
    if (this.form.invalid) return;
    const values = this.form.getRawValue();

    try {
        const user = await this.api.invoke(adminControllerSignin, {
            body: {
                email: values.email,
                password: values.password,
            },
        });

        console.log('로그인 성공');
        this.adminStore.setUser(user);
        this.router.navigate(['/dashboard']);
    } catch (error: any) {
        this.errorMessage = error?.error?.message || '로그인에 실패했습니다.';
    }
}
```

### 한 줄씩 풀이

**`async submit() { ... }`**
- `async`는 "이 함수 안에서 시간이 걸리는 일(서버 요청)을 기다릴 수 있게 해줘"라는 표시.

**`if (this.form.invalid) return;`**
- 단계 2에서 정한 검증 규칙들 중 하나라도 실패하면 `form.invalid`가 true.
- 이 경우 함수를 즉시 종료(`return`)해서 서버에 잘못된 요청을 보내지 않음.
- **비유**: 우체국 직원이 포장이 잘못된 택배는 받지 않고 손님에게 돌려보내는 것.

**`const values = this.form.getRawValue();`**
- 폼의 모든 입력값을 객체로 꺼냄. 결과: `{ email: '...', password: '...' }`.

**`try { ... } catch { ... }`**
- "성공 경로"와 "실패 경로"를 분리.
- 서버 요청은 실패할 수 있으니(네트워크 오류, 비번 틀림 등) try/catch로 감쌈.
- **비유**: 택배 보내기 전에 "성공하면 알림 받기, 실패하면 어떻게 할지" 미리 정해두는 것.

---

## 단계 4 — api.invoke로 서버 요청 보내기

이 줄이 핵심이에요:

```ts
const user = await this.api.invoke(adminControllerSignin, {
    body: {
        email: values.email,
        password: values.password,
    },
});
```

### `api`가 뭔가?

[sign-in.page.ts](../apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts) 위쪽에 이렇게 적혀있어요:

```ts
private readonly api = inject(Api);
```

`Api`는 **자동 생성된 API 클라이언트**입니다. 서버가 만든 OpenAPI 스펙을 보고 ng-openapi-gen이 자동으로 생성한 코드(`libs/api-client/` 안에 있음).

### `adminControllerSignin`이 뭔가?

이것도 ng-openapi-gen이 자동 생성한 함수예요. 서버의 [admin.controller.ts](../apps/server/src/app/admin/admin.controller.ts)의 `signin` 메서드에 대응하는 클라이언트 측 호출 함수.

### `api.invoke(...)`가 하는 일

1. URL 결정: 자동 생성된 정보를 보고 `POST http://localhost:3000/api/admins/signin` 결정.
2. JSON으로 body 변환: `{ "email": "...", "password": "..." }`.
3. HTTP 요청 발사.
4. 서버 응답 대기.
5. 응답이 오면 결과 반환.

### `await`

서버 응답은 시간이 걸려요. `await`는 "**응답 올 때까지 여기서 기다려라**"라는 표시. 응답이 오면 결과가 `user` 변수에 담깁니다.

### 비유

`api.invoke` = "택배 회사에 전화해서 보낼 물건 픽업 요청하기"
`await` = "픽업 끝났다는 연락 받을 때까지 기다리기"

---

## 단계 5 — HTTP 요청이 네트워크를 떠남

`api.invoke` 내부적으로는 Angular의 `HttpClient`(provideHttpClient에서 등록한 그것)를 사용해 진짜 HTTP 요청을 보냅니다.

```
POST http://localhost:3000/api/admins/signin
Content-Type: application/json

{ "email": "admin@example.com", "password": "MyPass123!" }
```

이 요청이 브라우저를 떠나 서버로 향합니다. 서버까지는 보통 수십~수백 밀리초 걸려요.

### CORS는 이때 등장

브라우저는 보안상 "현재 페이지(localhost:4200)와 다른 도메인(localhost:3000)으로 요청 보내는 걸" 기본적으로 차단해요. 서버가 [main.ts](../apps/server/src/main.ts)에서 `app.enableCors()`를 켜놨기 때문에 통과됨.

---

## 단계 6 — 서버에 도착, ValidationPipe 통과

요청이 서버에 도착하면, **컨트롤러 함수에 들어가기 전에** 서버가 자동으로 검사합니다.

### 검사 1 — Body가 DTO에 맞는가? (ValidationPipe)

[main.ts](../apps/server/src/main.ts)에 등록된 `ValidationPipe`가 자동으로 작동:
```ts
app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
}));
```

들어온 JSON `{ email, password }`를 [AdminSignInDTO](../apps/server/src/app/admin/dtos/admin-sign-in.dto.ts) 클래스에 대입하고, 그 안의 데코레이터들을 모두 검사:

```ts
@IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
@IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
email: string;

@IsNotEmpty(...)
@IsString()
@MinLength(8, ...)
@MaxLength(16, ...)
@Matches(/.../, ...)
password: string;
```

하나라도 실패하면 컨트롤러까지 가지 않고 **400 Bad Request로 즉시 응답**합니다.

### 비유

세관 검사. 서류(=body)가 양식에 맞지 않으면 본부에 못 들어가고 돌려보내짐.

---

## 단계 7 — Controller가 호출됨

검증을 통과하면 [admin.controller.ts](../apps/server/src/app/admin/admin.controller.ts)의 `signin` 메서드가 실행됩니다:

```ts
@Post('signin')
@ApiOperation({
    summary: '관리자 로그인',
    description: '관리자를 로그인합니다.',
})
@ApiOkResponse({
    description: '로그인 성공',
    type: AdminDTO,
})
async signin(@Body() data: AdminSignInDTO): Promise<AdminDTO> {
    const admin = await this.adminService.signIn(data);
    return plainToInstance(AdminDTO, admin);
}
```

### 한 줄씩 풀이

**`@Post('signin')`**
- "POST /api/admins/signin 요청이 오면 이 메서드 실행". '/admins'는 클래스의 `@Controller('admins')`에서 옴.

**`@Body() data: AdminSignInDTO`**
- "요청의 body를 꺼내서 `data` 변수에 담아". 타입은 AdminSignInDTO.

**`const admin = await this.adminService.signIn(data);`**
- 핵심 비즈니스 로직은 Service에 위임. 컨트롤러는 "들어온 걸 service로 넘기고 결과를 받는" 우체국 입구 역할만 함.

**`return plainToInstance(AdminDTO, admin);`**
- DB에서 받은 raw 객체를 [AdminDTO](../apps/server/src/app/admin/dtos/admin.dto.ts)로 변환.
- AdminDTO에는 `@Exclude()` 가 있어서 `@Expose()`로 표시한 필드만 응답에 포함됨.
- → **password 같은 민감 필드는 자동으로 빠짐**.

### 비유

컨트롤러 = 우체국 접수창구
- 손님(클라이언트)이 보낸 물건을 받음.
- 실제 처리는 뒤편 작업장(Service)에 넘김.
- 작업이 끝나면 결과를 다시 포장(plainToInstance)해서 손님에게 돌려줌.

---

## 단계 8 — Service에서 진짜 로직 실행

[admin.service.ts](../apps/server/src/app/admin/admin.service.ts)의 `signIn`이 핵심 로직을 처리합니다:

```ts
async signIn(data: AdminSignInDTO): Promise<Admin> {
    const { email, password } = data;

    const admin = await this.prisma.admin.findFirst({
        where: {
            email: email,
            deletedAt: null,
        },
    });

    if (!admin) {
        throw new UnauthorizedException({
            message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        });
    }

    const isPasswordValid = compareSync(password, admin.password);

    if (!isPasswordValid) {
        throw new UnauthorizedException({
            message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        });
    }

    this.eventEmitter.emit(AdminEvents.ADMIN_LOGGED_IN, { admin })

    return admin;
}
```

### 한 줄씩 풀이

**`const { email, password } = data;`**
- data 객체에서 email, password 두 값을 한 번에 꺼내는 **구조 분해** 문법.
- 같은 의미: `const email = data.email; const password = data.password;`

**`this.prisma.admin.findFirst({ where: { email, deletedAt: null } })`**
- Prisma에게 "Admin 테이블에서 email이 일치하고, 삭제되지 않은(deletedAt이 null인) 행 1개 찾아줘"
- 이 줄이 실제로 DB에 SQL을 보내는 부분.
- SQL로 환산: `SELECT * FROM "Admin" WHERE email = '...' AND deletedAt IS NULL LIMIT 1`

**`if (!admin) throw new UnauthorizedException(...)`**
- 검색 결과가 없으면 401(Unauthorized) 에러를 던짐.
- NestJS가 이 throw를 잡아서 자동으로 `{ statusCode: 401, message: '...' }` 응답을 클라이언트에 보냄.
- 보안 팁: "이메일 없음"과 "비번 틀림"을 같은 메시지로 처리. 그래야 공격자가 "이 이메일이 존재한다"는 정보를 못 얻음.

**`const isPasswordValid = compareSync(password, admin.password);`**
- bcryptjs의 `compareSync`로 평문 비번과 DB에 저장된 해시 비번을 비교.
- DB에는 비번이 해시(암호화)되어 저장돼 있어요. 원래 비번을 알 수 없는 단방향 변환.
- `compareSync`는 내부적으로 평문을 해시로 변환해서 일치 여부를 비교.

**`if (!isPasswordValid) throw new UnauthorizedException(...)`**
- 비번이 틀렸으면 401 에러.

**`this.eventEmitter.emit(AdminEvents.ADMIN_LOGGED_IN, { admin })`**
- "관리자가 로그인했어!"라는 이벤트를 발행.
- 이 이벤트를 수신하는 코드(예: [admin.listener.ts](../apps/server/src/app/admin/admin.listener.ts))가 자동으로 작동.
- 왜 직접 호출 안 하고 이벤트로? → 로그인 검증과 부가 작업(로그 기록, 마지막 로그인 시각 갱신 등)을 분리하기 위해.

**`return admin;`**
- 검증 통과한 admin 데이터를 컨트롤러로 돌려줌.
- 컨트롤러는 이걸 받아 AdminDTO로 변환해 응답.

---

## 단계 9 — Prisma가 DB에 진짜 쿼리를 보냄

`this.prisma.admin.findFirst(...)` 호출 시 내부적으로:

1. Prisma가 옵션을 분석해서 SQL을 만듬.
   ```sql
   SELECT * FROM "Admin"
   WHERE "email" = $1 AND "deletedAt" IS NULL
   LIMIT 1
   ```
2. Prisma가 사용 중인 어댑터(PrismaPg, [prisma.service.ts](../apps/server/src/prisma/prisma.service.ts))를 통해 PostgreSQL에 SQL 전송.
3. PostgreSQL이 결과를 돌려줌.
4. Prisma가 결과를 TypeScript 객체로 변환.

### 비유

Prisma = 통역사. 우리는 한국어(`findFirst({...})`)로 부탁하지만, DB는 SQL이라는 다른 언어만 알아들음. Prisma가 한국어를 SQL로 통역해서 DB와 대화함.

---

## 단계 10 — Event Listener가 작동 (병렬)

서비스에서 `eventEmitter.emit(...)`를 호출한 순간, [admin.listener.ts](../apps/server/src/app/admin/admin.listener.ts)의 `@OnEvent` 메서드가 자동 실행됩니다:

```ts
@OnEvent(AdminEvents.ADMIN_LOGGED_IN)
async handleAdminLoggedInEvent(payload: { admin: Admin }) {
    const { admin } = payload;
    this.logger.log(`관리자 로그인 이벤트 처리 완료: ${admin.email}`);
}
```

이 함수가 콘솔에 로그를 남깁니다 (실무에서는 여기서 마지막 로그인 시각 업데이트, Slack 알림 등 추가 작업을 할 수 있음).

### 중요

이 이벤트 처리는 **메인 흐름과 분리되어 동작**합니다. 즉, 서비스의 `signIn`은 이벤트를 발행하고 바로 다음 줄(`return admin`)로 진행해요. Listener의 작업이 끝나기를 기다리지 않습니다.

### 비유

택배 회사에서 손님에게 영수증을 주면서(`return admin`) 동시에 사내 시스템에 로그를 남기는 일(이벤트 처리). 손님은 영수증만 받으면 되니까 사내 로그 기다릴 필요 없음.

---

## 단계 11 — Controller에서 응답 조립

Service가 admin 객체를 반환하면, 컨트롤러로 돌아옵니다:

```ts
async signin(@Body() data: AdminSignInDTO): Promise<AdminDTO> {
    const admin = await this.adminService.signIn(data);
    return plainToInstance(AdminDTO, admin);   // ← 여기로 옴
}
```

### `plainToInstance(AdminDTO, admin)`이 하는 일

1. admin은 Prisma가 준 "그냥 객체" (`password`, `deletedAt` 등 모든 필드 포함).
2. AdminDTO 클래스에는 `@Exclude()`가 클래스 레벨에 있고, 필드들에 `@Expose()`만 표시.
3. plainToInstance가 이걸 보고 **@Expose 표시된 필드만** 새 객체로 옮김.
4. 결과: `{ id, email, name, role, failCount, lockedUntil, lastLoginAt, createdAt, updatedAt, deletedAt }` (password 빠짐!)

### 비유

음식점에서 주방장이 만든 그릇 전체에는 양념통, 칼, 도마 등이 있지만, 손님에게는 **음식만 담은 새 접시**로 옮겨서 내놓는 것.

---

## 단계 12 — HTTP 응답이 클라이언트로 돌아감

NestJS가 컨트롤러의 return 값을 자동으로 JSON으로 변환해 응답으로 보냅니다:

```
HTTP/1.1 200 OK
Content-Type: application/json

{
    "id": "...",
    "email": "admin@example.com",
    "name": "최고 관리자",
    "role": "최고관리자",
    "failCount": 0,
    ...
}
```

응답이 네트워크를 다시 건너 admin 앱(브라우저)으로 돌아갑니다.

---

## 단계 13 — Admin에서 응답 받기

[sign-in.page.ts](../apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts)의 `await this.api.invoke(...)` 가 드디어 끝나고 결과를 받습니다:

```ts
const user = await this.api.invoke(adminControllerSignin, {
    body: { email: values.email, password: values.password },
});
// 여기로 옴! user 변수에 응답 데이터가 들어있음
```

`user` 변수에는 단계 12에서 받은 JSON이 담깁니다.

### 만약 실패했다면?

서버에서 401을 보냈으면, `await`가 에러를 던지면서 `catch` 블록으로 점프:

```ts
} catch (error: any) {
    this.errorMessage = error?.error?.message || '로그인에 실패했습니다.';
}
```

- `error?.error?.message`: NestJS가 보낸 에러 메시지 추출 (`?.`는 중간 값이 없으면 undefined 반환).
- `|| '...기본 메시지...'`: 메시지가 없으면 기본 메시지로 대체.
- `this.errorMessage`에 저장 → HTML에서 `{{ errorMessage }}`로 표시되어 사용자가 봄.

---

## 단계 14 — AdminStore에 사용자 정보 저장

성공했다면 다음 줄이 실행됩니다:

```ts
this.adminStore.setUser(user);
```

[admin.store.ts](../apps/admin/src/app/stores/admin.store.ts):
```ts
@Injectable({ providedIn: 'root' })
export class AdminStore {
    private readonly state = signal<{ user: AdminDto | null }>({ user: null });
    readonly user = computed(() => this.state().user);

    setUser(user: AdminDto): void {
        this.state.update(s => ({ ...s, user }));
    }
}
```

### 왜 이게 필요한가?

로그인한 사용자 정보를 앱 전체에서 알아야 해요. 예: 헤더에 "환영합니다 admin@example.com" 표시, 권한별 메뉴 표시 등.

`AdminStore`는 앱 전체가 공유하는 "게시판" 같은 곳. 로그인 페이지에서 적어두면, 다른 페이지(대시보드, 헤더 등)에서 읽을 수 있음.

### `signal`이 핵심

`signal()`로 만든 변수는 "값이 바뀌면 화면이 자동으로 갱신되는" 특별한 변수. 보통 변수와 다르게, Angular가 변화를 추적함.

### 비유

회사 화이트보드. 로그인 페이지가 "오늘 출근한 사람: admin"이라고 화이트보드에 적으면, 다른 사무실에서도 그 화이트보드를 보고 안다.

---

## 단계 15 — 페이지 이동

마지막으로:
```ts
this.router.navigate(['/dashboard']);
```

`Router.navigate(['/dashboard'])`는 **코드로 페이지를 바꾸는** 함수입니다. 사용자가 링크를 클릭한 것과 같은 효과.

[app.routes.ts](../apps/admin/src/app/app.routes.ts)에서 `'dashboard'` 경로가 매핑된 컴포넌트(DashboardPage)가 화면에 나타남.

### 비유

전화 교환. "다음 부서로 연결해주세요"라고 부탁하면 자동으로 다른 부서로 전화가 넘어감.

---

## 전체 흐름을 다시 그림으로

```
사용자가 로그인 버튼 클릭
        │
        ▼
[1] sign-in.page.html의 (click)="submit()" 트리거
        │
        ▼
[2-3] sign-in.page.ts submit() 함수 실행
       - form.invalid 검사
       - form.getRawValue()로 값 추출
       - try 블록 진입
        │
        ▼
[4-5] api.invoke(adminControllerSignin, { body: { email, password } })
       → HTTP POST 요청 발사
        │
        ▼ (네트워크 이동)
        │
[6] 서버 도착
   - CORS 허용 확인
   - ValidationPipe가 AdminSignInDTO 검사
        │
        ▼ (통과)
[7] admin.controller.ts signin() 메서드 호출
        │
        ▼
[8] admin.service.ts signIn() 메서드 호출
   - prisma.admin.findFirst()로 DB 조회
        │
        ▼
[9] Prisma가 SQL 만들어서 PostgreSQL에 전송
        │
        ▼ (DB 결과)
[8 계속]
   - bcryptjs.compareSync로 비번 검증
   - 성공하면 eventEmitter.emit(...)
        │
        ▼ (이벤트 발행)
[10] admin.listener.ts @OnEvent 메서드가 (병렬로) 작동
        │
        ▼
[11] Service가 admin 반환 → Controller가 plainToInstance(AdminDTO, admin)
        │
        ▼
[12] NestJS가 JSON으로 변환해 HTTP 응답 전송
        │
        ▼ (네트워크 이동)
[13] Admin 앱의 await가 결과 받음
        │
        ▼ (성공이면)
[14] adminStore.setUser(user)로 전역 상태 저장
        │
        ▼
[15] router.navigate(['/dashboard'])로 대시보드 이동
```

---

## 정리 — 각 영역의 역할

| 영역 | 역할 | 비유 |
| --- | --- | --- |
| HTML | 화면 모양 | 메뉴판 |
| .ts (Component) | 사용자 동작 처리 | 주방장 |
| Forms | 입력값 + 검증 | 주문서 양식 |
| Router | 페이지 이동 | 전화 교환 |
| AdminStore | 앱 전역 상태 | 사내 게시판 |
| api.invoke / HttpClient | HTTP 요청 | 우편 발송 |
| CORS / ValidationPipe | 서버 입구 검사 | 세관 |
| Controller | 요청 받기 | 우체국 접수창구 |
| Service | 핵심 비즈니스 로직 | 작업장 |
| Prisma | SQL 통역 | 통역사 |
| EventEmitter | 부가 작업 분리 | 사내 메모 시스템 |
| bcryptjs | 비번 해시/비교 | 금고 자물쇠 |
| plainToInstance | 민감 정보 제거 후 응답 조립 | 손님용 새 접시에 옮기기 |

---

## 직접 따라가보기 (실습 가이드)

이 흐름을 직접 눈으로 보려면:

1. **DB 띄우기**: `docker-compose -f docker/docker-compose.yml up -d`
2. **서버 실행**: `pnpm nx serve server`
3. **관리자 화면 실행**: `pnpm nx serve admin`
4. **브라우저 개발자 도구 열기** (F12):
   - **Network 탭**: 단계 5의 실제 HTTP 요청 확인
   - **Console 탭**: 단계 8/10/13의 로그 메시지 확인
5. **서버 콘솔**: 단계 10의 EventListener 로그 확인
6. **Swagger UI** (`http://localhost:3000/reference`): 단계 7의 API를 직접 호출해보기

각 단계가 코드와 어떻게 연결되는지 두 눈으로 확인하면 머리에 박힙니다.

---

## 다음 단계

이 흐름을 이해했다면, 다른 도메인(FAQ, 공지사항, 행사)도 같은 패턴으로 동작합니다. 단지:
- DTO가 다름 (요청/응답 필드만 다름)
- Service 로직이 다름 (CRUD 함수)
- Controller URL이 다름

큰 구조는 똑같아요. 이 한 사이클을 머리에 박아두면 **앞으로 모든 사이클을 같은 방식으로 따라갈 수 있습니다**.
