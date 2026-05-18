import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { adminControllerSignin, Api } from "@api-client";
import { AdminStore } from "../../../stores/admin.store";
import { Router } from "@angular/router";
import { AuthService } from "../../../services/auth.service";

@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in.page.html',
    imports: [CommonModule, ReactiveFormsModule],
})
export default class SignInPage {
    private readonly api = inject(Api);
    private readonly adminStore = inject(AdminStore);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    errorMessage = '';

    form = new FormGroup({
        email: new FormControl('', {
            validators: [
                Validators.required,
                Validators.email,
            ],
            nonNullable: true,
        }),
        password: new FormControl('', {
            validators: [
                Validators.required,
                Validators.minLength(8),
                Validators.maxLength(16),
                Validators.pattern(
                    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
                )
            ],
            nonNullable: true,
        }),
    });

    keydownHandler(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            this.submit();
        }
    }

    async submit(): Promise<void> {
        if (this.form.invalid) return;

        const values = this.form.getRawValue();

        try {
            const result = await this.api.invoke(adminControllerSignin, {
                body: {
                    email: values.email,
                    password: values.password,
                },
            });

            this.authService.setToken(result.accessToken);
            this.authService.setStoredAdmin(result.admin);
            this.adminStore.setAdmin(result.admin);

            this.router.navigateByUrl('/dashboard');
        } catch (error: any) {
            this.errorMessage = error?.error?.message || '로그인에 실패했습니다.';
        }
    }
}
