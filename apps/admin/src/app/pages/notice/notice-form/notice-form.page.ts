import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Api, noticeControllerCreate } from "@api-client";

@Component({
    selector: 'app-notice-form',
    templateUrl: './notice-form.page.html',
    imports: [CommonModule],
})
export default class NoticeFormPage {
    private readonly api = inject(Api);
    private readonly router = inject(Router);

    form = new FormGroup({
        title: new FormControl('', {
            validators: [
                Validators.required,
            ],
            nonNullable: true,
        }),
        content: new FormControl('', {
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
            const notice = await this.api.invoke(noticeControllerCreate, {
                body: {
                    title: data.title,
                    content: data.content,
                },
            });

            console.log('공지사항 신규 등록 성공');

            this.router.navigate(['/notice']);

        } catch (error: any) {
            this.errorMessage = error?.error?.message || '공지사항 신규 등록에 실패했습니다.'
        }
    }

}