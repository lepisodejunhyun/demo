/**
 * ============================================================
 * [ Angular Routing(라우팅)이란? ]
 * "어떤 URL로 접속하면 어떤 페이지(컴포넌트)를 보여줄지" 정의하는 설정 파일.
 *
 * 비유: 건물의 안내판.
 *   /sign-in    → 로그인 페이지로 안내
 *   /dashboard  → 대시보드 페이지로 안내
 *   /faq        → FAQ 페이지로 안내
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. Route[]         — 라우트(경로) 설정 배열
 * 2. path            — URL 경로 매핑
 * 3. redirectTo      — 다른 경로로 자동 이동 (리다이렉트)
 * 4. pathMatch       — 경로 매칭 전략 ('full' vs 'prefix')
 * 5. loadComponent   — 지연 로딩 (Lazy Loading)
 * 6. component       — 즉시 로딩 (Eager Loading)
 * 7. children        — 중첩 라우트 (레이아웃 안에 페이지 배치)
 * 8. data            — 라우트에 추가 데이터 첨부 (title 등)
 * ============================================================
 */

import { Route } from '@angular/router';

/**
 * [ import vs loadComponent의 차이 ]
 *
 * 여기서 DefaultLayout은 일반 import로 가져옴 (즉시 로딩).
 * → 앱이 시작될 때 바로 메모리에 로드됨.
 * → 레이아웃은 거의 모든 페이지에서 쓰이므로 즉시 로딩이 적합.
 *
 * 반면 각 페이지들은 loadComponent로 가져옴 (지연 로딩).
 * → 해당 URL에 접속할 때만 로드됨. 아래에서 자세히 설명.
 */
import DefaultLayout from './layout/default/layout.component';

/**
 * [ Route[] — 라우트 설정 배열 ]
 *
 * 배열 안의 각 객체가 하나의 경로 규칙.
 * Angular Router는 위에서부터 순서대로 URL과 비교하여 첫 번째 일치하는 규칙을 적용.
 * → 순서가 중요! 더 구체적인 경로를 위에, 범용적인 경로를 아래에 배치.
 */
export const appRoutes: Route[] = [
    /**
     * [ 리다이렉트 — 기본 경로 설정 ]
     *
     * path: ''       → 아무 경로 없이 접속했을 때 (예: http://localhost:4200/)
     * redirectTo     → 자동으로 이 경로로 이동시킴
     * pathMatch      → 경로 매칭 방식
     *   'full'       → URL이 path와 완전히 같을 때만 매칭
     *   'prefix'     → URL이 path로 시작하기만 하면 매칭 (기본값)
     *
     * 주의: path: '' + redirectTo 조합에서는 반드시 'full'을 써야 함.
     *   → 'prefix'를 쓰면 ''는 모든 URL의 접두사이므로 모든 경로가 리다이렉트되어 무한 루프 발생!
     *   → 단, children을 가진 부모 라우트에서는 'prefix'가 정상 (자식 경로를 매칭하기 위해 필요).
     *
     * 결과: http://localhost:4200/ → http://localhost:4200/sign-in 으로 자동 이동
     */
    {
        path: '',
        redirectTo: 'sign-in',
        pathMatch: 'full',
    },

    /**
     * [ 독립 페이지 — 레이아웃 없이 단독으로 표시되는 페이지 ]
     *
     * path: 'sign-in' → http://localhost:4200/sign-in
     *
     * data: { title: '...' }
     * → 이 라우트에 추가 데이터를 첨부. 페이지 제목, 권한 정보 등에 활용 가능.
     *   컴포넌트에서 ActivatedRoute를 통해 접근 가능.
     *
     * loadComponent: () => import(...)
     * → [ 지연 로딩 (Lazy Loading) ]
     *   이 페이지에 접속할 때만 해당 파일을 다운로드하여 로드.
     *   앱 시작 시에는 로드하지 않으므로 초기 로딩 속도가 빨라짐.
     *
     *   import() 안의 경로는 .ts 파일 경로 (확장자 생략).
     *   해당 파일의 export default 컴포넌트를 자동으로 찾아서 로딩.
     *
     * 주의: 이 라우트는 children 배열 밖에 있으므로 DefaultLayout(사이드바, 헤더)이 적용되지 않음.
     *       → 로그인 페이지는 레이아웃 없이 전체 화면으로 표시됨.
     */
    {
        path: 'sign-in',
        data: { title: '관리자 로그인' },
        loadComponent: () => import('./pages/auth/sign-in/sign-in.page'),
    },

    /**
     * [ 레이아웃 라우트 — 공통 레이아웃 안에 페이지를 배치하는 패턴 ]
     *
     * path: ''
     * → 빈 경로. 이 자체로는 URL에 아무것도 추가하지 않음.
     *   children의 path가 실제 URL을 결정.
     *   예: children에 path: 'dashboard' → http://localhost:4200/dashboard
     *
     * component: DefaultLayout (즉시 로딩)
     * → loadComponent가 아닌 component를 사용.
     *   위에서 import한 DefaultLayout을 바로 사용 (지연 로딩 아님).
     *
     * DefaultLayout의 HTML에는 <router-outlet></router-outlet>이 있음.
     * → 이 태그 위치에 children의 컴포넌트가 렌더링됨.
     *
     * 결과적인 화면 구조:
     * ┌──────────────────────────────┐
     * │ Header (헤더)                │
     * ├────────┬─────────────────────┤
     * │        │                     │
     * │ Side   │  <router-outlet>    │
     * │  bar   │  ← 여기에 children  │
     * │        │    페이지가 표시됨   │
     * │        │                     │
     * └────────┴─────────────────────┘
     */
    {
        path: '',
        component: DefaultLayout,
        children: [
            /**
             * [ 자식 라우트 (Children Routes) ]
             *
             * 이 배열의 각 라우트는 DefaultLayout 안의 <router-outlet>에 렌더링됨.
             * 사이드바와 헤더는 유지되고, 가운데 콘텐츠 영역만 바뀜.
             *
             * 모든 자식 라우트가 동일한 패턴:
             *   path:          URL 경로
             *   data:          라우트 부가 데이터 (제목 등)
             *   loadComponent: 지연 로딩으로 페이지 컴포넌트 불러오기
             */
            {
                path: 'dashboard',
                data: { title: '관리자 대시보드' },
                loadComponent: () => import('./pages/dashboard/dashboard.page'),
            },
            {
                path: 'faq',
                data: { title: 'FAQ 관리' },
                loadComponent: () => import('./pages/faq/faq.page'),
            },
            {
                path: 'faq/create',
                data: { title: 'FAQ 등록 ' },
                loadComponent: () => import('./pages/faq/faq-form/faq-form.page'),
            },
            {
                path: 'faq/:id/edit',
                data: { title: 'FAQ 수정' },
                loadComponent: () => import('./pages/faq/faq-form/faq-form.page'),
            },
            {
                path: 'faq/:id',
                data: { title: 'FAQ 상세' },
                loadComponent: () => import('./pages/faq/faq-detail/faq-detail.page'),
            },
            {
                path: 'notice',
                data: { title: '공지사항 관리' },
                loadComponent: () => import('./pages/notice/notice.page'),
            },
            {
                path: 'notice/create',
                data: { title: '공지사항 등록' },
                loadComponent: () => import('./pages/notice/notice-form/notice-form.page'),
            },
            {
                path: 'notice/:id/edit',
                data: { title: '공지사항 수정' },
                loadComponent: () => import('./pages/notice/notice-form/notice-form.page'),
            },
            {
                path: 'notice/:id',
                data: { title: '공지사항 상세' },
                loadComponent: () => import('./pages/notice/notice-detail/notice-detail.page'),
            },
            {
                path: 'settings',
                data: { title: '설정' },
                loadComponent: () => import('./pages/setting/setting.page'),
            }
        ]
    }
];
