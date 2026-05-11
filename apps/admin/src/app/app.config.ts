/**
 * ============================================================
 * [ app.config.ts란? ]
 * 1. 개념: Angular 앱의 "전역 설정 + 초기화" 파일.
 *          Angular 14+ 의 standalone(모듈 없는) 방식에서 NgModule을 대신함.
 *
 * 2. NestJS의 main.ts와 짝을 이루는 클라이언트 진입점:
 *    server/main.ts        → NestJS 부트스트랩 + 전역 파이프/CORS 등 설정
 *    admin/main.ts         → bootstrapApplication(AppComponent, appConfig) 호출
 *    admin/app.config.ts   → ↑ 그 appConfig가 여기서 정의됨 (전역 providers 모음)
 *
 * [ Standalone Components 패턴이란? ]
 * 1. 옛 방식 (Angular 13 이하):
 *    - AppModule, FeatureModule 같은 NgModule이 필수.
 *    - 모든 컴포넌트는 어떤 모듈에 declarations로 등록되어야 함.
 *    - 보일러플레이트가 많음.
 *
 * 2. 새 방식 (Angular 14+, 17부터 권장):
 *    - 컴포넌트가 standalone: true로 자체 완결.
 *    - NgModule 없이 컴포넌트 자체가 자신의 imports를 선언.
 *    - main.ts에서 bootstrapApplication(컴포넌트, 설정)으로 부팅.
 *    - 이 app.config.ts가 그 "설정" 부분.
 *
 * 3. NestJS의 AppModule과 다른 점:
 *    - NestJS: AppModule이 모든 것을 모음 (모듈 트리).
 *    - Angular: 각 컴포넌트가 독립적이고, app.config.ts는 "전역 서비스"만 제공.
 *
 * [ providers란? ]
 * 1. 개념: 앱 전체에서 사용할 의존성(서비스, 토큰)을 등록하는 배열.
 * 2. 효과: 한번 등록하면 어느 컴포넌트/서비스에서든 inject()로 받아 쓸 수 있음.
 * 3. NestJS의 providers와 비슷한 개념. Angular도 DI 컨테이너를 사용.
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. ApplicationConfig                      — Angular 앱 설정 타입
 * 2. provideXxx 함수 패턴                   — Angular의 새로운 설정 스타일
 * 3. provideZonelessChangeDetection()       — Zone.js 없이 동작하는 최신 변화 감지
 * 4. Change Detection (변화 감지) 메커니즘
 * 5. provideBrowserGlobalErrorListeners()   — 전역 에러 로깅
 * 6. provideRouter() + withComponentInputBinding() — 라우터 + URL 파라미터 자동 주입
 * 7. provideHttpClient()                    — HttpClient 활성화
 * 8. provideApiConfiguration()              — 자동 생성된 API 클라이언트의 서버 주소 지정
 * ============================================================
 */

import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient } from '@angular/common/http'
import { provideApiConfiguration } from 'libs/api-client/src/lib/api-configuration';
import { withComponentInputBinding } from '@angular/router';

/**
 * ============================================================
 * [ appConfig — 앱 전역 설정 객체 ]
 *
 * 1. 타입: ApplicationConfig — Angular가 제공하는 설정 객체 타입.
 *          providers 배열을 가진 단순한 객체.
 *
 * 2. 흐름: admin/main.ts에서 bootstrapApplication(AppComponent, appConfig) 호출.
 *          → Angular가 providers 배열의 모든 함수를 순서대로 실행.
 *          → 각 함수가 앱의 기능을 활성화함.
 *
 * 3. provideXxx 패턴이란?
 *    - Angular 14+ 의 새로운 설정 스타일.
 *    - 옛 방식: NgModule.imports = [BrowserModule, RouterModule.forRoot(...), ...]
 *    - 새 방식: providers = [provideRouter(...), provideHttpClient(), ...]
 *    - 함수형 + 트리쉐이킹 친화적 + 더 명시적.
 * ============================================================
 */
export const appConfig: ApplicationConfig = {
  providers: [
    /**
     * ============================================================
     * [ provideZonelessChangeDetection() — Zone.js 없는 최신 변화 감지 ]
     *
     * 1. 변화 감지(Change Detection)란?
     *    데이터가 바뀌면 화면을 다시 그리는 Angular의 핵심 메커니즘.
     *    "어떤 데이터가 바뀌었는가?"를 감지하고 그 부분만 다시 렌더링.
     *
     * 2. 옛 방식 (Zone.js 기반):
     *    - Zone.js라는 라이브러리가 setTimeout / fetch / 이벤트 등
     *      모든 비동기 작업을 가로채서 감시.
     *    - 비동기 작업이 끝날 때마다 Angular에게 "변화가 있을 수도 있어"라고 알림.
     *    - Angular는 화면 전체를 다시 확인하여 바뀐 부분을 찾음.
     *    - 단점: Zone.js가 무겁고, 모든 비동기를 가로채야 해서 디버깅 어려움.
     *
     * 3. 새 방식 (Zoneless, Angular 18+):
     *    - Zone.js를 완전히 제거.
     *    - signal()의 변화만 감지해서 정확히 필요한 부분만 갱신.
     *    - 장점:
     *      a) 번들 크기 감소 (Zone.js가 수십 KB).
     *      b) 성능 향상 (불필요한 변화 감지 X).
     *      c) 디버깅 용이 (스택 트레이스가 깔끔).
     *
     * 4. admin.store.ts와의 연관:
     *    - admin.store.ts에서 signal/computed를 쓰는 이유와 직결됨.
     *    - 일반 변수는 변경해도 화면이 안 바뀜.
     *    - signal로 만들어야 Angular가 변경을 감지하고 화면을 갱신.
     * ============================================================
     */
    provideZonelessChangeDetection(),

    /**
     * [ provideBrowserGlobalErrorListeners() ]
     *
     * 1. 효과: 처리되지 않은 전역 에러를 Angular의 ErrorHandler로 전달.
     *    - unhandled error (try/catch로 안 잡힌 에러)
     *    - unhandled promise rejection (.catch 안 한 Promise 실패)
     *
     * 2. 없으면? → 에러가 콘솔에 그냥 흘러나오기만 함. 통합 로깅이 어려움.
     *
     * 3. 응용: 커스텀 ErrorHandler를 등록하면 Sentry 같은 외부 서비스에
     *         자동으로 에러를 보내는 시스템 구축 가능.
     */
    provideBrowserGlobalErrorListeners(),

    /**
     * ============================================================
     * [ provideRouter(라우트, ...기능들) — 라우터 등록 ]
     *
     * 1. appRoutes:
     *    - app.routes.ts에 정의한 라우트 배열. (/sign-in, /dashboard, ...)
     *    - 이 라우트들이 라우터에 등록되어 URL → 컴포넌트 매핑이 활성화됨.
     *
     * 2. withComponentInputBinding() — URL 파라미터 → 컴포넌트 input 자동 주입:
     *
     *    a) 개념:
     *       라우트의 :id 같은 파라미터를 컴포넌트의 input()에 자동으로 연결해줌.
     *
     *    b) 작동 흐름:
     *       [1] 라우트 정의: path: 'faq/:id'
     *       [2] 컴포넌트에서: id = input<string>();
     *       [3] 사용자가 /faq/abc 접속
     *       [4] Angular Router가 자동으로 컴포넌트의 id input에 'abc' 주입
     *       [5] this.id() === 'abc'
     *
     *    c) 이 옵션이 없으면? — 옛 방식을 써야 함:
     *       constructor(private route: ActivatedRoute) {}
     *       ngOnInit() {
     *         this.route.paramMap.subscribe(p => this.id = p.get('id'));
     *       }
     *       → 코드량 ↑, 구독 해제 신경 써야 함, 보일러플레이트 ↑.
     *
     *    d) 활성화 효과:
     *       - faq-detail.page.ts가 깔끔하게 input()만으로 동작하는 비결.
     *       - URL의 쿼리 파라미터(?key=value)와 data 옵션도 동일하게 input으로 받을 수 있음.
     * ============================================================
     */
    provideRouter(appRoutes, withComponentInputBinding()),

    /**
     * [ provideHttpClient() — HttpClient 활성화 ]
     *
     * 1. HttpClient의 정체:
     *    - Angular가 제공하는 HTTP 요청 도구.
     *    - fetch나 axios 같은 역할이지만 Angular의 DI 시스템과 통합됨.
     *
     * 2. 자동 생성된 API 클라이언트와의 관계:
     *    - @api-client의 Api 클래스가 내부적으로 HttpClient를 사용.
     *    - 이 줄이 빠지면 api.invoke() 호출 시 런타임 에러:
     *      "No provider for HttpClient!"
     *
     * 3. 인터셉터(Interceptor) 추가:
     *    - 모든 HTTP 요청/응답에 공통 로직을 적용할 때 사용.
     *    - 예: 인증 토큰 자동 첨부, 에러 공통 처리.
     *    - 문법: provideHttpClient(withInterceptors([authInterceptor]))
     */
    provideHttpClient(),

    /**
     * ============================================================
     * [ provideApiConfiguration(baseUrl) — API 클라이언트 서버 주소 설정 ]
     *
     * 1. provideApiConfiguration의 출처:
     *    - libs/api-client/src/lib/api-configuration에서 import.
     *    - server/main.ts의 ng-openapi-gen이 자동 생성한 함수.
     *
     * 2. 효과: 자동 생성된 API 클라이언트의 "기본 서버 주소"를 등록.
     *    api.invoke(adminControllerSignin, ...)를 호출하면 실제로는
     *    POST http://localhost:3000/api/admins/signin 으로 요청이 나감.
     *      └─ baseUrl ──────┘└─ controller path ─┘
     *
     * 3. 운영 환경 대응:
     *    개발: provideApiConfiguration('http://localhost:3000')
     *    운영: provideApiConfiguration(environment.apiUrl) 같은 식으로 분기 필요.
     *    환경별 environment.ts 파일로 관리하는 게 일반적.
     *
     * 4. 만약 잘못 설정하면?
     *    - 잘못된 URL → 모든 API 호출이 실패 (CORS 에러 또는 404).
     *    - server/main.ts의 enableCors()와 짝을 이루는 부분.
     * ============================================================
     */
    provideApiConfiguration('http://localhost:3000'),
  ],
};
