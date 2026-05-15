import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const router = inject(Router);

  // SSR에서는 localStorage를 못 읽으므로 일단 통과시킴
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (authService.isLoggedIn) {
    return true;
  }

  // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  // 로그인 후 원래 가려던 페이지로 돌아오기 위해 returnUrl 추가
  return router.createUrlTree(['/sign-in'], {
    queryParams: { returnUrl: state.url }
  });
};
