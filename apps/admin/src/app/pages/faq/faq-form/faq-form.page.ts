import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Api, faqControllerCreate } from "@api-client";

@Component({
    selector: 'app-faq-form',
    templateUrl: './faq-form.page.html',
    imports: [CommonModule],
})
export default class FaqFormPage {
    private readonly api = inject(Api);
    private readonly router = inject(Router);

    form = new FormGroup({
        question: new FormControl('', {
            validators: [
                Validators.required,
            ],
            nonNullable: true,
        }),
        answer: new FormControl('', {
            validators: [
                Validators.required,
            ],
            nonNullable: true,
        })
    });

    errorMessage = '';

    async onSubmit() {
        if (this.form.invalid) return;

        const data = this.form.getRawValue();

        try {
            const faq = await this.api.invoke(faqControllerCreate, {
                body: {
                    question: data.question,
                    answer: data.answer,
                },
            });

            console.log('FAQ 신규 등록 성공');

            this.router.navigate(['/faq']);

        } catch (error: any) {
            this.errorMessage = error?.error?.message || 'FAQ 신규 등록에 실패했습니다.'
        }
    }

}