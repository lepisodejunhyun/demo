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
                path: 'notice',
                data: { title: '공지사항 관리' },
                loadComponent: () => import('./pages/notice/notice.page'),
            },
            {
                path: 'settings',
                data: { title: '설정' },
                loadComponent: () => import('./pages/setting/setting.page'),
            }
        ]
    }
];
