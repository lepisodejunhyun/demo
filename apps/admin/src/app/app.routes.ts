import { Route } from '@angular/router';
import DefaultLayout from './layout/default/layout.component';
import { authGuard, guestGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
    {
        path: '',
        pathMatch: 'full',
        data: { title: '관리자 로그인' },
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/auth/sign-in/sign-in.page'),
    },
    {
        path: '',
        component: DefaultLayout,
        canActivate: [authGuard],
        children: [
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
            },
            {
                path: 'event',
                data: { title: '행사 관리' },
                loadComponent: () => import('./pages/event/event.page'),
            },
            {
                path: 'event/create',
                data: { title: '행사 정보 등록' },
                loadComponent: () => import('./pages/event/event-form/event-form.page'),
            },
            {
                path: 'event/:id/edit',
                data: { title: '행사 정보 수정' },
                loadComponent: () => import('./pages/event/event-form/event-form.page'),
            },
            {
                path: 'event/:id',
                data: { title: '행사 정보 상세 조회' },
                loadComponent: () => import('./pages/event/event-detail/event-detail.page')
            },
            {
                path: 'pre-registration',
                data: { title: '사전 등록 관리' },
                loadComponent: () => import('./pages/pre-registration/pre-registration.page'),
            },
            {
                path: 'pre-registration/create',
                data: { title: '사전 등록' },
                loadComponent: () => import('./pages/pre-registration/pre-registration-form/pre-registration-form.page'),
            },
            {
                path: 'pre-registration/:id/edit',
                data: { title: '사전 등록 수정' },
                loadComponent: () => import('./pages/pre-registration/pre-registration-form/pre-registration-form.page'),
            },
            {
                path: 'pre-registration/:id',
                data: { title: '사전 등록 상세' },
                loadComponent: () => import('./pages/pre-registration/pre-registration-detail/pre-registration-detail.page'),
            },
            {
                path: 'gallery',
                data: { title: '갤러리 관리' },
                loadComponent: () => import('./pages/gallery/gallery.page'),
            },
            {
                path: 'gallery/create',
                data: { title: '갤러리 등록' },
                loadComponent: () => import('./pages/gallery/gallery-form/gallery-form.page'),
            },
            {
                path: 'gallery/:id',
                data: { title: '갤러리 상세 조회' },
                loadComponent: () => import('./pages/gallery/gallery-detail/gallery-detail.page'),
            },
            {
                path: 'gallery/:id/edit',
                data: { title: '갤러리 수정' },
                loadComponent: () => import('./pages/gallery/gallery-form/gallery-form.page'),
            },
            {
                path: 'business-info',
                data: { title: '사업자 정보' },
                loadComponent: () => import('./pages/business-info/business-info.page'),
            },
            {
                path: 'terms',
                data: { title: '약관 관리' },
                loadComponent: () => import('./pages/terms/terms.page'),
            },
            {
                path: 'terms/create',
                data: { title: '약관 등록' },
                loadComponent: () => import('./pages/terms/terms-form/terms-form.page'),
            },
            {
                path: 'terms/:id/edit',
                data: { title: '약관 수정' },
                loadComponent: () => import('./pages/terms/terms-form/terms-form.page'),
            },
            {
                path: 'terms/:id',
                data: { title: '약관 상세' },
                loadComponent: () => import('./pages/terms/terms-detail/terms-detail.page'),
            },
            {
                path: 'inquiry',
                data: { title: '1:1 문의' },
                loadComponent: () => import('./pages/inquiry/inquiry.page'),
            },
            {
                path: 'inquiry/:id',
                data: { title: '1:1 문의 상세' },
                loadComponent: () => import('./pages/inquiry/inquiry-detail/inquiry-detail.page'),
            },
        ],
    },
    {
        path: '**',
        redirectTo: '',
    }
];
