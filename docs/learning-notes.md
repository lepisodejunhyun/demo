# 학습 노트

이 프로젝트를 개발하면서 궁금했던 개념들과 그 답변을 정리한 문서입니다.

---

## 📌 Angular 기초 개념

### inject() vs constructor 주입

Angular에서 서비스를 가져오는 두 가지 방법입니다. **기능은 동일**하고 스타일 차이입니다.

```typescript
// 방법 1: constructor 주입 (전통적)
class SignInPage {
  constructor(private readonly router: Router) {}
}

// 방법 2: inject() 주입 (최신 — 이 프로젝트에서 사용)
class SignInPage {
  private readonly router = inject(Router);
}
```

#### 프로젝트가 커졌을 때 inject()가 유리한 이유

**서비스가 많아질 때:**
```typescript
// constructor — 길어짐
constructor(
  private readonly store: AdminStore,
  private readonly router: Router,
  private readonly toast: ToastService,
  private readonly upload: UploadService,
  // ... 계속 늘어남
) {}

// inject() — 필요한 곳 근처에 선언 가능
readonly store = inject(AdminStore);
readonly router = inject(Router);
```

**상속할 때:**
```typescript
// constructor — super()로 부모 서비스 전달 필요
class SignInPage extends BasePage {
  constructor(router: Router, private readonly store: AdminStore) {
    super(router);  // 귀찮음
  }
}

// inject() — 부모 신경 안 써도 됨
class SignInPage extends BasePage {
  private readonly store = inject(AdminStore);
}
```

#### inject() 사용 규칙

```typescript
// ✅ inject 가능 — @Injectable() 데코레이터가 있는 Angular 서비스
inject(AdminStore)    // @Injectable({ providedIn: 'root' })
inject(Router)        // Angular 내장 서비스
inject(Api)           // ng-openapi-gen이 생성한 서비스

// ❌ inject 불가 — 일반 함수, 타입
adminControllerSignin  // 그냥 함수 → import해서 직접 호출
AdminSignInDto         // 타입 → type import
```

---

### private / readonly / public

```typescript
export class SignInPage {
  private readonly api = inject(Api);     // private + readonly
  readonly adminStore = inject(AdminStore); // public(기본) + readonly
  errorMessage = '';                        // public + 변경 가능
}
```

| 키워드 | 의미 | 예시 |
|---|---|---|
| `private` | 클래스 내부에서만 사용 가능. HTML 템플릿에서 접근 불가 | 서비스, 라우터 등 내부 로직용 |
| `readonly` | 한번 설정하면 재할당 불가 | 서비스는 바뀔 일 없으니 readonly |
| (아무것도 안 씀) | public. HTML에서도 접근 가능 | errorMessage 등 화면에 표시할 데이터 |

#### HTML에서 접근이 필요하면 private을 빼야 함

```typescript
// .ts
readonly adminStore = inject(AdminStore);  // private 없음

// .html — 접근 가능
@if (adminStore.user()) {
  <p>{{ adminStore.user()?.name }}님 환영합니다</p>
}
```

---

### @Component 데코레이터

```typescript
@Component({
  selector: 'app-sign-in',                   // HTML 태그 이름
  templateUrl: './sign-in.component.html',    // 화면 디자인 파일
  imports: [CommonModule, ReactiveFormsModule], // 사용할 기능 목록
})
```

| 속성 | 역할 | 비유 |
|---|---|---|
| `selector` | `<app-sign-in>` 태그로 사용 가능 | 컴포넌트의 **이름표** |
| `templateUrl` | 화면 디자인이 있는 HTML 파일 경로 | 컴포넌트의 **얼굴** |
| `imports` | 이 컴포넌트에서 쓸 Angular 기능들 | **필요한 도구 목록** |

`imports`에 넣지 않으면 HTML에서 해당 기능 사용 불가:
- `CommonModule` → `@if`, `@for` 사용 가능
- `ReactiveFormsModule` → `formGroup`, `formControlName` 사용 가능

---

### Angular HTML 파일 구조

Angular에서는 `<html>`, `<head>`, `<body>` 태그가 컴포넌트 HTML에 **없는 게 정상**이다.

이유: `index.html`에 이미 있기 때문.

```
index.html (뼈대)
  └── <body>
        └── <app-root>              ← Angular가 이 태그를 찾아서
              └── app.html 내용으로 교체   ← 최상위 컴포넌트
                    └── <router-outlet>     ← URL에 따라 내용 교체
                          └── sign-in.component.html  ← /sign-in일 때
```

#### index.html — 브라우저가 처음 로드하는 파일

```html
<!doctype html>
<html lang="en">
  <head>...</head>
  <body>
    <app-root></app-root>    ← Angular가 여기부터 관리
  </body>
</html>
```

#### app.html — 모든 페이지에 공통으로 표시되는 내용

```html
<router-outlet></router-outlet>    ← "여기에 페이지를 끼워 넣어줘"
```

#### 컴포넌트 HTML — 해당 페이지의 내용만 작성

```html
<!-- sign-in.component.html -->
<div>관리자 로그인</div>
<!-- <html>, <body> 없이 내용만 -->
```

비유: **액자(index.html) 안에 배경지(app.html) 깔고, 그 위에 사진(컴포넌트)을 끼워 넣는 것**

### `<router-outlet>` — URL에 따라 컴포넌트를 교체하는 자리

```html
<!-- app.html -->
<router-outlet></router-outlet>
```

이 태그는 **"여기에 페이지를 넣어줘"** 라는 빈 슬롯이다.

어떤 페이지를 넣을지는 `app.routes.ts`에서 결정:

```typescript
// app.routes.ts
{ path: 'sign-in', loadComponent: () => import('./pages/auth/sign-in/sign-in.component') }
{ path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component') }
```

```
/sign-in 접속   → router-outlet에 sign-in.component.html 표시
/dashboard 접속 → router-outlet에 dashboard.component.html 표시
```

---

### export default class

```typescript
export default class SignInPage { ... }
```

`export default`는 `app.routes.ts`에서 이렇게 불러올 수 있게 해줌:

```typescript
loadComponent: () => import('./pages/auth/sign-in/sign-in.component')
```

`default`가 없으면 이렇게 써야 함 (더 길어짐):

```typescript
loadComponent: () => import('./pages/auth/sign-in/sign-in.component')
  .then(m => m.SignInPage)
```

---

## 📌 TypeScript 개념

### 타입 추론 — 적을 필요 없으면 안 적어도 됨

TypeScript가 자동으로 알 수 있는 경우 타입을 생략해도 됩니다.

```typescript
// ❌ 불필요한 명시 — TypeScript가 이미 아는 정보를 또 적는 것
const name: string = 'hello';
const count: number = 42;
const api: Api = inject<Api>(Api);

// ✅ 추론에 맡기기
const name = 'hello';        // TypeScript: "이건 string이네"
const count = 42;             // TypeScript: "이건 number이네"
const api = inject(Api);      // TypeScript: "이건 Api이네"
```

**명시해야 하는 경우**: TypeScript가 추론 못할 때만

```typescript
let user: AdminDto | null = null;   // null만 보고는 타입을 모름
const items: string[] = [];          // 빈 배열만 보고는 뭐가 들어갈지 모름
```

**성능 차이**: 없음. 타입 정보는 컴파일 시 전부 제거됨.

---

### 정규식 (RegExp)

비밀번호 검증에 사용한 정규식 해설:

```
/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
```

| 부분 | 의미 |
|---|---|
| `^` | 문자열 시작 |
| `(?=.*[a-zA-Z])` | 영문자 최소 1개 포함 |
| `(?=.*\d)` | 숫자 최소 1개 포함 |
| `(?=.*[@$!%*?&])` | 특수문자(`@$!%*?&`) 최소 1개 포함 |
| `[A-Za-z\d@$!%*?&]+` | 허용된 문자로 1개 이상 구성 |
| `$` | 문자열 끝 |

```
✅ Abc12345!     → 통과
❌ abc12345      → 특수문자 없음
❌ abcdefgh!     → 숫자 없음
❌ 12345678!     → 영문 없음
```

길이 검사는 `Validators.minLength(8)`, `Validators.maxLength(16)`으로 별도 처리.

---

## 📌 비동기 프로그래밍

### 동기 vs 비동기

```
동기(Sync):   물 끓이기 → (3분 대기) → 면 넣기 → (3분 대기) → 먹기
비동기(Async): 물 끓이기 → (기다리는 동안 계란 까기) → 면 넣기 → 먹기
```

웹에서 서버 통신은 반드시 **비동기**. 동기로 하면 응답 올 때까지 화면이 얼어버림.

### Promise (약속)

**"지금은 없지만 나중에 결과를 줄게"** 라는 약속 객체.

```
비유: 식당 진동벨
  주문 → 진동벨 받음(Promise) → 벨 울림 → 음식 받음(결과)
```

3가지 상태:
- 🟡 **Pending** — 아직 결과 안 나옴
- ✅ **Fulfilled** — 성공 (데이터 반환)
- ❌ **Rejected** — 실패 (에러 발생)

### Promise 처리 방법 2가지

```typescript
// 방법 1: .then().catch() (원래 방식)
this.api.invoke(adminControllerSignin, { body })
  .then(user => { /* 성공 */ })
  .catch(error => { /* 실패 */ });

// 방법 2: async/await (더 읽기 쉬움 — 이 프로젝트에서 사용)
async submit() {
  try {
    const user = await this.api.invoke(adminControllerSignin, { body });
    // 성공
  } catch (error) {
    // 실패
  }
}
```

두 방법은 **완전히 동일한 동작**. `async/await`가 가독성이 좋아서 주로 사용.

### async/await 규칙

- `await`는 **Promise를 기다리는** 키워드
- `await`를 쓰려면 함수에 **`async`가 필수**
- `async` 함수는 자동으로 **Promise를 반환**

```typescript
async submit() {          // async 선언 필수
  const user = await ...;  // await 사용 가능
}
```

---

### Observable vs Promise

| | Observable | Promise |
|---|---|---|
| 사용처 | millionshow-v2 (AdminService) | demo (Api.invoke) |
| 처리 | `.subscribe({ next, error })` | `try/catch` + `await` |
| 함수 선언 | `submit()` | `async submit()` |
| 값 반환 | 여러 번 가능 | 1번만 |
| 취소 | 가능 (`.unsubscribe()`) | 불가 |

```typescript
// Observable (millionshow-v2)
this.adminService.adminControllerSignin({ body })
  .subscribe({
    next: res => { /* 성공 = try */ },
    error: err => { /* 실패 = catch */ },
  });

// Promise (demo)
try {
  const user = await this.api.invoke(adminControllerSignin, { body });
} catch (error) {
  // 실패
}
```

---

## 📌 API 클라이언트 (ng-openapi-gen)

### 자동 생성 흐름

```
서버 코드 (Controller + DTO)
  → SwaggerModule이 OpenAPI 스펙 생성
  → $RefParser가 $ref 참조 해결
  → NgOpenApiGen이 Angular 코드 생성
  → libs/api-client/src/lib/ 에 파일 저장
```

서버를 실행할 때마다 자동 생성. 서버 코드 수정 → 서버 재시작 → API 클라이언트 최신 상태 유지.

### API 함수 이름 규칙

```
서버: AdminController 클래스의 signin 메서드
  → AdminController + signin
  → camelCase 변환
  → adminControllerSignin
```

첫 글자는 항상 소문자 (JavaScript 함수 컨벤션).

### v0 vs v1 차이

| | v0 (millionshow-v2) | v1 (demo) |
|---|---|---|
| 생성물 | 컨트롤러별 서비스 클래스 (AdminService) | Api 서비스 하나 + 독립 함수들 |
| 사용법 | `this.adminService.메서드().subscribe()` | `await this.api.invoke(함수)` |
| 반환 | Observable | Promise |
| 설정 | `ApiModule.forRoot()` | `provideApiConfiguration()` |

### Api.invoke()를 쓰는 이유

자동 생성된 함수는 `HttpClient`와 `rootUrl`을 매번 넘겨야 함:

```typescript
// ❌ 직접 호출 — 매번 http, rootUrl 전달 필요
adminControllerSignin(this.http, 'http://localhost:3000', { body })

// ✅ invoke — 자동으로 넣어줌
this.api.invoke(adminControllerSignin, { body })
```

---

## 📌 파일 네이밍 컨벤션

### Angular 기본 컨벤션

```
sign-in.component.ts    ← 컴포넌트 로직
sign-in.component.html  ← 템플릿
sign-in.component.css   ← 스타일
```

### millionshow-v2 컨벤션

```
sign-in.page.ts         ← 페이지 컴포넌트 (.page로 구분)
sign-in.page.html
```

이 프로젝트에서는 **Angular 기본 컨벤션** (.component) 사용.
