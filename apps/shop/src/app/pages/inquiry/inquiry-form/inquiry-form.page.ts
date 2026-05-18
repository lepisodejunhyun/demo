import { CommonModule, Location } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Api, inquiryControllerCreate } from "@api-client-shop";

@Component({
    selector: 'app-inquiry-form',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './inquiry-form.page.html',
})
export default class InquiryFormPage {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly location = inject(Location);

    form = new FormGroup({
        title: new FormControl('', {
            validators: [Validators.required, Validators.maxLength(100)],
            nonNullable: true,
        }),
        content: new FormControl('', {
            validators: [Validators.required, Validators.maxLength(2000)],
            nonNullable: true,
        }),
    });

    errorMessage = '';

    async onSubmit(): Promise<void> {
        if (this.form.invalid) return;

        try {
            const data = this.form.getRawValue();
            await this.api.invoke(inquiryControllerCreate, {
                body: {
                    title: data.title,
                    content: data.content,
                },
            });
            this.router.navigate(['/support/inquiry']);
        } catch (error: any) {
            this.errorMessage = error?.error?.message || '문의 작성에 실패했습니다.';
        }
    }

    goBack(): void {
        this.location.back();
    }
}
