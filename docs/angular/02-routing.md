# Angular 라우팅 — app.routes.ts

**파일 위치:** `apps/admin/src/app/app.routes.ts`

---

## 라우팅이란?

URL을 보고 어떤 화면을 보여줄지 결정하는 것이에요.

```
http://localhost:4200/          → 메인 페이지
http://localhost:4200/signin    → 로그인 페이지
http://localhost:4200/dashboard → 대시보드 페이지
http://localhost:4200/admins    → 관리자 목록 페이지
```

각 URL마다 다른 컴포넌트를 보여줘야 해요. 이 규칙을 정의하는 파일이 `app.routes.ts`예요.

---

## 현재 코드

```typescript
import { Route } from '@angular/router';

export const appRoutes: Route[] = [];
```

지금은 비어있어요. 아직 라우트를 설정하지 않아서 어떤 URL로 접속해도 아무것도 표시 안 돼요.

---

## 앞으로 추가될 구조 (예시)

```typescript
import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',               // http://localhost:4200/
    redirectTo: 'signin',   // /signin으로 리다이렉트
    pathMatch: 'full',
  },
  {
    path: 'signin',         // http://localhost:4200/signin
    loadComponent: () =>
      import('./pages/auth/sign-in/sign-in.component').then(
        m => m.SignInPage
      ),
  },
  {
    path: 'dashboard',      // http://localhost:4200/dashboard
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        m => m.DashboardComponent
      ),
  },
];
```

---

## `Route` 타입 설명

```typescript
export const appRoutes: Route[] = []
```

`Route`는 Angular가 제공하는 타입이에요. 하나의 라우트 설정을 표현해요.

`Route[]`는 Route 배열 — 여러 개의 라우트 설정을 배열에 담아요.

---

## 라우트 설정 옵션들

### `path` — URL 경로

```typescript
{ path: 'signin', ... }    // /signin 과 매핑
{ path: 'dashboard', ... } // /dashboard 와 매핑
{ path: '', ... }          // / (루트) 와 매핑
{ path: '**', ... }        // 위에 없는 모든 URL (404 처리)
```

---

### `loadComponent` — 레이지 로딩 ⭐

```typescript
{
  path: 'signin',
  loadComponent: () =>
    import('./pages/auth/sign-in/sign-in.component').then(
      m => m.SignInPage
    ),
}
```

**레이지 로딩(Lazy Loading)이란?**

앱을 처음 열 때 모든 페이지 코드를 한 번에 다운로드하는 게 아니라, **필요할 때만** 해당 페이지 코드를 다운로드하는 방식이에요.

```
레이지 로딩 없이:
  앱 첫 로드 시 → 모든 페이지 코드 한 번에 다운로드
  → 로그인 페이지 하나 보려고 대시보드, 관리자 목록 등 모든 코드 다운로드
  → 초기 로딩 느림

레이지 로딩 사용:
  앱 첫 로드 시 → 공통 코드만 다운로드
  /signin 접속 시 → SignInPage 코드만 다운로드
  /dashboard 접속 시 → DashboardComponent 코드만 다운로드
  → 초기 로딩 빠름
```

**코드 설명:**

```typescript
loadComponent: () =>               // 함수 (URL 접근 시 실행됨)
  import('./pages/auth/sign-in/sign-in.component')  // 동적 import
  .then(m => m.SignInPage)    // 가져온 모듈에서 SignInPage 꺼내기
```

`import()`는 동적 import라고 해요. 함수처럼 호출할 수 있고, 그 시점에 해당 파일을 다운로드해요.

---

### `redirectTo` — 리다이렉트

```typescript
{
  path: '',
  redirectTo: 'signin',
  pathMatch: 'full',
}
```

`http://localhost:4200/` 로 접속하면 자동으로 `http://localhost:4200/signin` 으로 이동해요.

`pathMatch: 'full'` — 경로가 정확히 `''`일 때만 리다이렉트 (부분 매치 제외)

---

### `component` vs `loadComponent`

```typescript
// component: 즉시 로딩 (레이지 로딩 없음)
{ path: 'signin', component: SignInPage }
// 앱 시작 시 SignInPage를 포함한 전체 번들을 다운로드

// loadComponent: 레이지 로딩
{ path: 'signin', loadComponent: () => import(...).then(...) }
// /signin 접속 시에만 SignInPage를 다운로드
```

작은 앱은 `component`도 괜찮지만, 페이지가 많아지면 `loadComponent`가 성능상 유리해요.

---

## `<router-outlet>` 과의 연결

`app.html`에 `<router-outlet>`이 있어요:

```html
<router-outlet></router-outlet>
```

URL이 바뀌면:
```
1. 라우터가 URL을 확인
2. appRoutes에서 매칭되는 path 찾기
3. 해당 컴포넌트를 <router-outlet> 위치에 렌더링
```

```
URL: /signin
  app.html:
  <router-outlet>
    <app-sign-in>  ← SignInPage가 여기에 들어옴
      <form>...</form>
    </app-sign-in>
  </router-outlet>
```

---

## 페이지 이동 방법

### HTML 템플릿에서

```html
<!-- routerLink 사용 (Angular 라우터 방식) -->
<a routerLink="/signin">로그인 페이지로</a>
<a routerLink="/dashboard">대시보드로</a>
```

일반 `<a href="/signin">`을 쓰면 페이지 전체가 새로고침돼요 (SPA의 장점 사라짐).

`routerLink`를 쓰면 페이지 전체 새로고침 없이 컴포넌트만 교체돼요.

---

### TypeScript 코드에서

```typescript
import { Router } from '@angular/router';

@Component({ ... })
export class SignInPage {
  constructor(private router: Router) {}

  onLoginSuccess() {
    this.router.navigate(['/dashboard']);  // 프로그래밍 방식으로 이동
  }
}
```

로그인 성공 후 자동으로 대시보드로 이동하는 코드 예시예요.

---

## 앞으로 추가할 폴더 구조

```
apps/admin/src/app/
├── app.routes.ts          ← 라우트 설정
├── pages/                 ← 페이지 컴포넌트들
│   ├── auth/
│   │   └── sign-in/
│   │       ├── sign-in.component.ts
│   │       ├── sign-in.component.html
│   │       └── sign-in.component.css
│   └── dashboard/
│       ├── dashboard.component.ts
│       └── ...
└── stores/
    └── admin.store.ts
```

`pages/` 폴더 안에 각 페이지별로 폴더를 만들어요.

---

## 라우팅 요약

```
app.routes.ts
    ↓
URL → 컴포넌트 매핑 규칙 정의
    ↓
app.html의 <router-outlet>
    ↓
URL에 맞는 컴포넌트 교체 표시
    ↓
레이지 로딩: 해당 페이지 접속 시에만 코드 다운로드
```

**핵심:** 라우팅은 Angular 앱에서 "페이지 이동"을 담당하며, 전체 페이지 새로고침 없이 컴포넌트만 교체해서 SPA(Single Page Application)를 구현해요.
