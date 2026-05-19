import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import {
    Api,
    inquiryControllerFindById,
    inquiryControllerRemove,
    inquiryControllerUpdate,
    InquiryDto,
} from "@api-client";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { DetailViewComponent } from "../../../components/detail-view/detail-view.component";
import { FormTextareaComponent } from "../../../components/form-textarea/form-textarea.component";


@Component({
    selector: 'app-inquiry-detail',
    templateUrl: 'inquiry-detail.page.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, BreadcrumbComponent, DetailViewComponent, FormTextareaComponent],
})
export default class InquiryDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);

    id = input<string>();

    inquiry = signal<InquiryDto | null>(null);

    breadcrumbs: Breadcrumb[] = [
        { label: '1:1 문의', link: '/inquiry' },
        { label: '상세 보기' },
    ];

    answerForm = new FormGroup({
        answer: new FormControl('', {
            validators: [
                Validators.required,
                Validators.maxLength(2000),
            ],
            nonNullable: true,
        }),
    });

    errorMessage = signal('');
    successMessage = signal('');

    async ngOnInit(): Promise<void> {
        const id = this.id();
        if (!id) return;

        await this.loadData(id);
    }

    async loadData(id: string): Promise<void> {
        try {
            this.inquiry.set(await this.api.invoke(inquiryControllerFindById, { id }));

            // 기존 답변이 있으면 폼에 채우기

            const data = this.inquiry();
            if (data?.answer) {
                this.answerForm.patchValue({
                    answer: data.answer,
                });
            }
        } catch (error) {
            console.error('1:1 문의 조회 실패', error);
            this.router.navigate(['/inquiry']);
        }
    }

    async onSubmitAnswer(): Promise<void> {
        if (this.answerForm.invalid) return;

        const data = this.answerForm.getRawValue();
        this.errorMessage.set('');
        this.successMessage.set('');

        try {
            this.inquiry.set(await this.api.invoke(inquiryControllerUpdate, {
                id: this.inquiry()!.id,
                body: {
                    answer: data.answer,
                },
            }));

            this.successMessage.set('답변이 저장되었습니다.');
        } catch (error: any) {
            this.errorMessage.set(error?.error?.message || '답변 저장에 실패했습니다.');
        }
    }

    async onDelete(): Promise<void> {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await this.api.invoke(inquiryControllerRemove, {
                id: this.inquiry()!.id,
            });
            this.router.navigate(['/inquiry']);
        } catch (error) {
            console.error('1:1 문의 삭제 실패', error);
        }
    }
}
