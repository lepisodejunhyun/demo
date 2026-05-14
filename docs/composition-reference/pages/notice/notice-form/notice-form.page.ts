import { CommonModule, Location } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Api, noticeControllerCreate, noticeControllerFindById, noticeControllerUpdate } from "@api-client";

// 조합 방식: 필요한 컴포넌트를 개별로 import
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { PageTitleComponent } from "../../../components/page-title/page-title.component";
import { FormActionsComponent } from "../../../components/form-actions/form-actions.component";

@Component({
    selector: 'app-notice-form',
    templateUrl: './notice-form.page.html',
    // 래핑 방식: imports: [CommonModule, ReactiveFormsModule, FormLayoutComponent]
    // 조합 방식: 사용하는 컴포넌트를 각각 import
    imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent, PageTitleComponent, FormActionsComponent],
})
export default class NoticeFormPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly location = inject(Location);

    id = input<string>();

    get isEditMode() { return !!this.id(); }

    breadcrumbs: Breadcrumb[] = [];

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

        this.breadcrumbs = [
            { label: '공지사항 관리', link: '/notice' },
            { label: this.isEditMode ? '수정' : '작성' },
        ];

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

    goBack(): void {
        this.location.back();
    }
}
