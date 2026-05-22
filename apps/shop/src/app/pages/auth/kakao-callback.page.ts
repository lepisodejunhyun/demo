import { ChangeDetectionStrategy, Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-kakao-callback',
    templateUrl: './kakao-callback.page.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class KakaoCallbackPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly toast = inject(ToastrService);

    async ngOnInit(): Promise<void> {
        if (!isPlatformBrowser(this.platformId)) return;

        const code = this.route.snapshot.queryParams['code'];

        if (!code) {
            this.router.navigate(['/sign-in']);
            return;
        }

        try {
            await this.authService.kakaoLogin(code);
            this.router.navigate(['/']);
        } catch (error) {
            console.error('카카오 로그인 실패', error);
            this.toast.error('로그인에 실패했습니다.');
            this.router.navigate(['/sign-in']);
        }
    }
}
