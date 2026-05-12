import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { Api, noticeControllerCreate, noticeControllerFindById, noticeControllerUpdate } from "@api-client";

@Component({
    selector: 'app-notice-form',
    templateUrl: './notice-form.page.html',
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
})
export default class NoticeFormPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    id = input<string>();

    get isEditMode() { return !!this.id(); }

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
            if (this.isEditMode) {
                await this.api.invoke(noticeControllerUpdate, {
                    id: this.id()!,
                    body: {
                        title: data.title,
                        content: data.content
                    },
                });
                this.router.navigate(['/notice', this.id()]);
            } else {
                const notice = await this.api.invoke(noticeControllerCreate, {
                    body: {
                        title: data.title,
                        content: data.content
                    },
                });
                this.router.navigate(['/notice', notice.id]);
            }
        } catch (error: any) {
            this.errorMessage = error?.error?.message || '요청이 실패했습니다.';
        }
    }

    async ngOnInit() {
        const id = this.id();

        if (id) {
            const notice = await this.api.invoke(noticeControllerFindById, {
                id: id,
            });
            this.form.patchValue({
                title: notice.title,
                content: notice.content,
            });
            this.cdr.markForCheck();
        }
    }

}