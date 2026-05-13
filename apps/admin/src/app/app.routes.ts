import { Route } from '@angular/router';
import DefaultLayout from './layout/default/layout.component';

export const appRoutes: Route[] = [
    {
        path: '',
        redirectTo: 'sign-in',
        pathMatch: 'full',
    },
    {
        path: 'sign-in',
        data: { title: '관리자 로그인' },
        loadComponent: () => import('./pages/auth/sign-in/sign-in.page'),
    },
    {
        path: '',
        component: DefaultLayout,
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
                path: 'pre-registration',
                data: { title: '사전 등록 관리' },
                loadComponent: () => import('./pages/pre-registration/pre-registration.page'),
            },
            {
                path: 'gallery',
                data: { title: '갤러리 관리' },
                loadComponent: () => import('./pages/gallery/gallery.page'),
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
                path: 'inquiry',
                data: { title: '1:1 문의' },
                loadComponent: () => import('./pages/inquiry/inquiry.page'),
            },
        ]
    }
];
