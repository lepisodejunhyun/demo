import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink, ActivatedRoute } from "@angular/router";
import { AuthService } from "../../shared/services/auth.service";

@Component({
    selector: 'app-sign-in',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './sign-in.page.html',
})
export default class SignInPage {

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

    errorMessage = '';

    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly authService = inject(AuthService);

    async onSubmit(): Promise<void> {
        if (this.form.invalid) return;

        try {
            const data = this.form.getRawValue();
            await this.authService.signIn(data.email, data.password);

            // returnUrl이 있으면 해당 경로로, 없으면 홈으로 이동
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
            this.router.navigateByUrl(returnUrl);

        } catch (error: any) {
            this.errorMessage = error?.error?.message || '이메일 또는 비밀번호가 올바르지 않습니다.';
        }
    }

    onKakaoLogin(): void {
        const clientId = '8a75f87171244712630be6c959f9ae83';
        const redirectUri = encodeURIComponent('http://localhost:4201/auth/kakao/callback');
        const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
        window.location.href = kakaoAuthUrl;
    }
}
