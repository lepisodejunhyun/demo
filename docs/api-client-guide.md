# API 클라이언트 사용 가이드

## 📌 이 문서가 뭔가요?

이 프로젝트에서 **프론트엔드(Angular)가 백엔드(NestJS) 서버와 통신하는 방법**을 설명하는 문서입니다.

---

## 🍔 비유로 이해하기

햄버거 가게를 상상해보세요.

- **백엔드 서버** = 주방 (음식을 만드는 곳)
- **프론트엔드** = 홀 (손님이 있는 곳)
- **API** = 메뉴판 (어떤 음식을 주문할 수 있는지 적혀있음)
- **API 클라이언트** = 주문서 양식 (메뉴판을 보고 자동으로 만들어진 주문서)

이 프로젝트에서는 **주방(서버)이 메뉴판(Swagger 문서)을 만들면**, 도구(`ng-openapi-gen`)가 자동으로 **주문서 양식(API 클라이언트 코드)을 생성**합니다.

프론트엔드 개발자는 이 주문서 양식을 가져다 쓰기만 하면 됩니다.

---

## 🔄 API 클라이언트가 만들어지는 과정

```
1. 서버 코드 작성 (Controller + DTO)
   ↓
2. 서버 실행 (pnpm nx serve server)
   ↓
3. Swagger가 서버 코드를 분석해서 API 문서(JSON) 생성
   ↓
4. ng-openapi-gen이 API 문서를 읽어서 TypeScript 코드 자동 생성
   ↓
5. libs/api-client/src/lib/ 폴더에 파일이 만들어짐
```

> 💡 **핵심**: 서버를 실행할 때마다 자동으로 생성됩니다.
> 서버 코드를 수정하면 → 서버 재시작 → API 클라이언트도 자동 업데이트!

---

## 📁 생성되는 파일 구조

```
libs/api-client/src/lib/
│
├── fn/                          ← API 함수들 (자동 생성)
│   ├── admin/
│   │   ├── admin-controller-signin.ts      ← 로그인 API
│   │   ├── admin-controller-find-all.ts    ← 관리자 목록 API
│   │   └── admin-controller-gethello.ts    ← 인사말 API
│   └── app/
│       └── app-controller-get-data.ts      ← 앱 데이터 API
│
├── models/                      ← 데이터 타입 (자동 생성)
│   ├── admin-dto.ts             ← 관리자 정보 타입
│   └── admin-sign-in-dto.ts     ← 로그인 요청 타입
│
├── api.ts                       ← Api 서비스 (Angular 서비스)
├── api-configuration.ts         ← API 서버 주소 설정
├── index.ts                     ← 전체 export 모음
├── request-builder.ts           ← HTTP 요청 조립기
└── strict-http-response.ts      ← 응답 타입
```

### 파일 역할 요약

| 파일/폴더 | 역할 | 비유 |
|---|---|---|
| `fn/` | 서버에 요청 보내는 함수들 | 주문서 양식들 |
| `models/` | 데이터의 모양(타입) 정의 | 주문서에 적을 수 있는 항목 설명 |
| `api.ts` | API 함수를 실행해주는 도우미 | 주문을 대신 전달해주는 직원 |
| `api-configuration.ts` | 서버 주소 설정 | 어느 주방에 주문할지 정하기 |

---

## 🚀 사용 방법

### 1단계: 앱 설정 (최초 1회)

`apps/admin/src/app/app.config.ts`에 서버 주소를 설정합니다.

```typescript
import { provideHttpClient } from '@angular/common/http';
import { provideApiConfiguration } from 'libs/api-client/src/lib/api-configuration';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... 다른 설정들
    provideHttpClient(),                                  // HTTP 통신 기능 켜기
    provideApiConfiguration('http://localhost:3000'),      // 서버 주소 설정
  ],
};
```

> 이것은 "우리 주방은 localhost:3000에 있어요"라고 알려주는 것입니다.

### 2단계: Api 서비스 주입

컴포넌트에서 `Api` 서비스를 가져옵니다.

```typescript
import { inject } from '@angular/core';
import { Api } from '@api-client';

export class MyComponent {
  private readonly api = inject(Api);   // Api 서비스 가져오기
}
```

> `inject(Api)` = "주문 대행 직원을 불러오기"

### 3단계: API 함수 import

사용할 API 함수를 가져옵니다.

```typescript
import { adminControllerSignin } from '@api-client';
```

> 이 함수는 "로그인 주문서 양식"입니다.

### 4단계: API 호출

```typescript
// 방법 A: Api 서비스의 invoke 사용 (Promise 반환 — 추천)
const result = await this.api.invoke(adminControllerSignin, {
  body: { email: 'test@test.com', password: '1234' }
});
// result = AdminDto (관리자 정보)

// 방법 B: 함수 직접 호출 (Observable 반환 — RxJS 필요)
adminControllerSignin(this.http, this.rootUrl, {
  body: { email: 'test@test.com', password: '1234' }
}).subscribe(response => {
  console.log(response.body);  // AdminDto
});
```

> **방법 A를 추천합니다.** `async/await`을 쓸 수 있어서 코드가 읽기 쉽습니다.

---

## 📝 실제 예제: 로그인

### 컴포넌트 코드 (sign-in.component.ts)

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

// API 관련 import
import { Api, adminControllerSignin } from '@api-client';
import type { AdminDto } from '@api-client';

// 상태 관리
import { AdminStore } from '../../../stores/admin.store';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  imports: [CommonModule, ReactiveFormsModule],
})
export default class SignInPage {
  // 서비스 주입
  private readonly api = inject(Api);             // API 호출용
  private readonly adminStore = inject(AdminStore); // 상태 저장용
  private readonly router = inject(Router);         // 페이지 이동용

  // 에러 메시지
  errorMessage = '';

  // 로그인 폼 정의
  form = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  // Enter 키 처리
  keydownHandler(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.submit();
    }
  }

  // 로그인 실행
  async submit() {
    if (this.form.invalid) return;

    const values = this.form.getRawValue();

    try {
      // API 호출: 서버에 로그인 요청
      const user = await this.api.invoke(adminControllerSignin, {
        body: {
          email: values.email,
          password: values.password,
        },
      });

      // 성공: 유저 정보 저장 + 페이지 이동
      this.adminStore.setUser(user);
      this.router.navigate(['/']);

    } catch (error: any) {
      // 실패: 에러 메시지 표시
      this.errorMessage = error?.error?.message || '로그인에 실패했습니다.';
    }
  }
}
```

---

## 📋 현재 사용 가능한 API 함수 목록

| 함수 이름 | HTTP 메서드 | 경로 | 설명 | 파라미터 |
|---|---|---|---|---|
| `adminControllerSignin` | POST | `/api/admins/signin` | 관리자 로그인 | `{ body: { email, password } }` |
| `adminControllerFindAll` | GET | `/api/admins` | 관리자 전체 조회 | 없음 |
| `adminControllerGethello` | GET | `/api/admins/hello` | 인사말 | 없음 |
| `appControllerGetData` | GET | `/api` | 앱 데이터 조회 | 없음 |

### 사용 예시

```typescript
// 로그인
const user = await this.api.invoke(adminControllerSignin, {
  body: { email: 'admin@test.com', password: '12345678' }
});

// 관리자 전체 조회
const admins = await this.api.invoke(adminControllerFindAll);

// 인사말 조회
const hello = await this.api.invoke(adminControllerGethello);
```

---

## 🔑 핵심 규칙 정리

### 규칙 1: 서버 코드를 수정하면 서버를 재시작하세요

서버 재시작 시 API 클라이언트가 자동으로 최신 상태로 업데이트됩니다.

### 규칙 2: 생성된 파일은 절대 직접 수정하지 마세요

`libs/api-client/src/lib/` 안의 파일은 전부 자동 생성됩니다.
직접 수정하면 서버 재시작 시 덮어씌워집니다.

### 규칙 3: API 함수는 `@api-client`에서 import

```typescript
// ✅ 올바른 방법
import { adminControllerSignin } from '@api-client';
import type { AdminDto } from '@api-client';

// ❌ 잘못된 방법 (직접 경로 사용 — 구조 변경 시 깨짐)
import { adminControllerSignin } from 'libs/api-client/src/lib/fn/admin/admin-controller-signin';
```

### 규칙 4: Api 서비스는 inject()로 가져오기

```typescript
// ✅ Angular 서비스라서 inject 가능
private readonly api = inject(Api);

// ❌ new로 직접 생성 불가 (Angular가 HttpClient를 주입해줘야 함)
const api = new Api();  // 에러!
```

---

## ❓ 자주 묻는 질문

### Q: 새 API를 추가하려면?

1. 서버에 새 Controller 또는 메서드를 추가
2. 서버 재시작
3. `libs/api-client/src/lib/`에 새 함수가 자동 생성됨
4. `import { 새함수 } from '@api-client'`로 바로 사용

### Q: API 함수 이름은 어떻게 정해지나요?

```
서버 코드:  AdminController → signin 메서드
변환 규칙:  클래스명 + 메서드명 → camelCase
결과:       adminControllerSignin
```

### Q: Observable과 Promise 차이는?

- **Promise**: `await`로 기다림. 값 1개 반환. 끝.
- **Observable**: `.subscribe()`로 구독. 값 여러개 가능. 취소 가능.

이 프로젝트에서는 `api.invoke()`를 쓰면 **Promise**로 변환해주므로
`async/await`를 편하게 쓸 수 있습니다.

### Q: 타입(모델)은 어떻게 쓰나요?

```typescript
// 타입만 가져올 때는 type import 사용
import type { AdminDto } from '@api-client';

// 변수에 타입 지정
const user: AdminDto = await this.api.invoke(adminControllerSignin, { ... });
// user.id, user.email, user.name 등 자동완성 됨!
```

### Q: millionshow-v2와 왜 다른가요?

| | millionshow-v2 | demo |
|---|---|---|
| 버전 | `ng-openapi-gen` v0.x | `ng-openapi-gen` v1.x |
| API 서비스 | 컨트롤러별 서비스 클래스 (AdminService) | Api 서비스 하나 + 함수들 |
| 사용법 | `this.adminService.메서드().subscribe()` | `await this.api.invoke(함수)` |
| 반환 | Observable | Promise |
