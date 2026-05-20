import { Route } from '@angular/router';
import ShopLayout from './layout/shop-layout/shop-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
    {
        path: 'sign-in',
        data: { title: '로그인' },
        loadComponent: () => import('./pages/sign-in/sign-in.page'),
    },
    {
        path: 'auth/kakao/callback',
        data: { title: '카카오 로그인' },
        loadComponent: () => import('./pages/auth/kakao-callback.page'),
    },
    {
        path: '',
        component: ShopLayout,
        children: [
            {
                path: '',
                data: { title: '홈' },
                loadComponent: () => import('./pages/home/home.page'),
            },
            {
                path: 'event',
                data: { title: '행사 안내' },
                loadComponent: () => import('./pages/event/event.page'),
            },
            {
                path: 'event/:id',
                data: { title: '행사 상세' },
                loadComponent: () => import('./pages/event/event-detail/event-detail.page'),
            },
            {
                path: 'gallery',
                data: { title: '갤러리' },
                loadComponent: () => import('./pages/gallery/gallery.page'),
            },
            {
                path: 'gallery/:id',
                data: { title: '갤러리 상세' },
                loadComponent: () => import('./pages/gallery/gallery-detail/gallery-detail.page'),
            },
            {
                path: 'pre-registration',
                data: { title: '사전 등록' },
                loadComponent: () => import('./pages/pre-registration/pre-registration.page'),
            },
            {
                path: 'pre-registration/complete',
                data: { title: '사전 등록 완료' },
                loadComponent: () => import('./pages/pre-registration/pre-registration-complete/pre-registration-complete.page'),
            },
            {
                path: 'pre-registration/:eventId',
                data: { title: '사전 등록 신청' },
                loadComponent: () => import('./pages/pre-registration/pre-registration-form/pre-registration-form.page'),
            },
            {
                path: 'support',
                data: { title: '고객센터' },
                loadComponent: () => import('./pages/support/support-layout.component'),
                children: [
                    {
                        path: '',
                        redirectTo: 'notice',
                        pathMatch: 'full',
                    },
                    {
                        path: 'notice',
                        data: { title: '공지사항' },
                        loadComponent: () => import('./pages/notice/notice.page'),
                    },
                    {
                        path: 'notice/:id',
                        data: { title: '공지사항 상세' },
                        loadComponent: () => import('./pages/notice/notice-detail/notice-detail.page'),
                    },
                    {
                        path: 'faq',
                        data: { title: '자주 묻는 질문' },
                        loadComponent: () => import('./pages/faq/faq.page'),
                    },
                    {
                        path: 'inquiry',
                        data: { title: '1:1 문의' },
                        canActivate: [authGuard],
                        loadComponent: () => import('./pages/inquiry/inquiry.page'),
                    },
                    {
                        path: 'inquiry/form',
                        data: { title: '문의 작성' },
                        canActivate: [authGuard],
                        loadComponent: () => import('./pages/inquiry/inquiry-form/inquiry-form.page'),
                    },
                    {
                        path: 'inquiry/:id/edit',
                        data: { title: '문의 수정' },
                        canActivate: [authGuard],
                        loadComponent: () => import('./pages/inquiry/inquiry-form/inquiry-form.page'),
                    },
                    {
                        path: 'inquiry/:id',
                        data: { title: '문의 상세' },
                        canActivate: [authGuard],
                        loadComponent: () => import('./pages/inquiry/inquiry-detail/inquiry-detail.page'),
                    },
                ],
            },
            {
                path: 'terms',
                data: { title: '약관 및 정책' },
                loadComponent: () => import('./pages/terms/terms.page'),
            },
            {
                path: '**',
                redirectTo: '',
            },
        ],
    },
];
