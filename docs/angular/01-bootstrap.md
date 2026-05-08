# Angular 앱 시작점 — main.ts, app.config.ts, app.ts

**파일 위치:**
- `apps/admin/src/main.ts`
- `apps/admin/src/app/app.config.ts`
- `apps/admin/src/app/app.ts`

---

## Angular 앱이 브라우저에서 시작되는 과정

브라우저가 어드민 앱에 접속하면:

```
1. 브라우저가 index.html 다운로드
   ↓
2. index.html이 main.ts(컴파일된 JS) 불러옴
   ↓
3. main.ts에서 bootstrapApplication() 실행
   ↓
4. app.config.ts의 providers 설정 적용
   ↓
5. App 컴포넌트(app.ts) 화면에 렌더링
   ↓
6. app.routes.ts의 라우팅에 따라 페이지 표시
```

---

## main.ts — 앱의 진입점

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

딱 3줄이에요. 매우 단순해요.

---

### `bootstrapApplication(App, appConfig)`

Angular 앱을 시작하는 함수예요.

```
bootstrapApplication(
  App,        ← 루트 컴포넌트 (화면의 최상위 컴포넌트)
  appConfig   ← 앱 전체 설정 (providers 등)
)
```

Angular 17+ 이전에는 `NgModule` 방식을 사용했어요:

```typescript
// 예전 방식 (NgModule)
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
```

현재 이 프로젝트는 **Standalone 방식** (NgModule 없음)을 사용해요. Angular 17+에서 권장하는 최신 방식이에요.

---

### `.catch((err) => console.error(err))`

앱 시작 중 에러가 발생하면 콘솔에 출력해요.

`bootstrapApplication`은 Promise를 반환하는 비동기 함수예요. `.catch()`로 에러를 잡아요.

---

## app.config.ts — 앱 전체 설정

```typescript
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { client } from '@api-client/client';

client.setConfig({ baseUrl: 'http://localhost:3000' });

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(appRoutes)],
};
```

---

### `client.setConfig({ baseUrl: 'http://localhost:3000' })`

```typescript
import { client } from '@api-client/client';

client.setConfig({ baseUrl: 'http://localhost:3000' });
```

자동 생성된 API 클라이언트에 서버 주소를 알려줘요.

이 설정이 있어야 `adminControllerSignin()` 같은 API 함수들이 `http://localhost:3000`으로 요청을 보내요.

```
client.setConfig({ baseUrl: 'http://localhost:3000' }) 없으면:
  adminControllerSignin() 호출 시
  → 어디로 보낼지 몰라서 에러 발생

설정 후:
  adminControllerSignin() 호출 시
  → POST http://localhost:3000/api/admins/signin 으로 요청
```

왜 `app.config.ts` 파일 최상단(`providers` 밖)에 두냐면: 앱이 시작되자마자 가장 먼저 실행되어야 하기 때문이에요. 어떤 컴포넌트보다 먼저 API 클라이언트 설정이 완료되어야 해요.

---

### `providers: [...]` — 앱 전체 의존성 등록

NestJS의 `providers`와 비슷한 개념이에요.

앱 전체에서 사용할 서비스들을 여기에 등록해요.

```typescript
providers: [
  provideBrowserGlobalErrorListeners(),  // 전역 에러 핸들러
  provideRouter(appRoutes),              // 라우터 설정
]
```

`provide~` 함수들은 Angular에서 제공하는 설정 함수들이에요. `new SomeService()`처럼 직접 만들지 않고 이 함수들을 써요.

---

**`provideBrowserGlobalErrorListeners()`**

브라우저에서 발생하는 처리되지 않은 에러들을 감지하는 리스너를 등록해요.

```javascript
// 이런 에러들을 잡아줘요
window.addEventListener('error', ...)
window.addEventListener('unhandledrejection', ...)
```

---

**`provideRouter(appRoutes)`**

Angular 라우터를 설정해요.

```typescript
import { appRoutes } from './app.routes';
```

`app.routes.ts`에 정의된 라우트 설정을 Router에 등록해요.

`http://localhost:4200/signin` → 어떤 컴포넌트를 보여줄지를 라우터가 결정해요.

---

### `ApplicationConfig` 타입

```typescript
export const appConfig: ApplicationConfig = { ... }
```

`ApplicationConfig`는 Angular가 제공하는 타입이에요. `providers` 배열을 포함하는 형태에요.

TypeScript가 잘못된 설정을 미리 잡아줘요:
```typescript
// 이런 실수를 컴파일 시점에 잡아줌
providers: [
  "잘못된값"  // ← 타입 에러
]
```

---

## app.ts — 루트 컴포넌트

앱의 가장 바깥 껍데기 역할이에요. 모든 페이지가 이 컴포넌트 안에서 표시돼요.

```typescript
// app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {}
```

```html
<!-- app.html -->
<router-outlet></router-outlet>
```

`<router-outlet>` — 현재 URL에 맞는 페이지 컴포넌트가 여기에 표시돼요.

```
URL: /signin
  → <router-outlet>에 SignInPage가 표시됨

URL: /dashboard
  → <router-outlet>에 DashboardComponent가 표시됨
```

---

## 예전 방식(NgModule)과 현재 방식(Standalone) 비교

**예전 방식 (NgModule):**

```typescript
// app.module.ts (예전)
@NgModule({
  declarations: [AppComponent, SignInPage],  // 컴포넌트 목록
  imports: [BrowserModule, RouterModule],          // 외부 모듈
  bootstrap: [AppComponent]
})
export class AppModule {}

// main.ts (예전)
platformBrowserDynamic().bootstrapModule(AppModule);
```

**현재 방식 (Standalone):**

```typescript
// app.config.ts (현재)
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(appRoutes)]
};

// main.ts (현재)
bootstrapApplication(App, appConfig);

// 각 컴포넌트가 필요한 것들을 직접 선언
@Component({
  standalone: true,               // ← 이 컴포넌트는 독립적
  imports: [RouterOutlet],        // ← 필요한 것만 import
  ...
})
```

**현재 방식의 장점:**
1. `NgModule` 파일이 없어서 코드가 간결해짐
2. 각 컴포넌트가 무엇을 사용하는지 명확하게 보임
3. 사용하지 않는 코드를 더 잘 제거할 수 있음 (Tree-shaking)
4. 레이지 로딩(지연 로딩)이 컴포넌트 단위로 가능

---

## 전체 시작 흐름 요약

```
브라우저 접속
    ↓
index.html 로드
    ↓
main.ts 실행
    ↓
bootstrapApplication(App, appConfig)
    ├── client.setConfig({ baseUrl: 'http://localhost:3000' })
    │   → API 클라이언트에 서버 주소 설정
    │
    └── providers 등록
        ├── provideBrowserGlobalErrorListeners() → 에러 핸들러
        └── provideRouter(appRoutes)             → 라우터
    ↓
App 컴포넌트 렌더링
    ↓
<router-outlet> → 현재 URL에 맞는 페이지 컴포넌트 표시
```
