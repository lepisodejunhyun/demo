import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import {
    Api,
    inquiryControllerFindById,
    inquiryControllerRemove,
    inquiryControllerUpdateAnswer,
    InquiryDto,
} from "@api-client";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { DetailViewComponent } from "../../../components/detail-view/detail-view.component";


@Component({
    selector: 'app-inquiry-detail',
    templateUrl: 'inquiry-detail.page.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, BreadcrumbComponent, DetailViewComponent],
})
export default class InquiryDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    id = input<string>();

    inquiry: InquiryDto | null = null;

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

    errorMessage = '';
    successMessage = '';

    async ngOnInit(): Promise<void> {
        const id = this.id();
        if (!id) return;

        await this.loadData(id);
    }

    async loadData(id: string): Promise<void> {
        try {
            this.inquiry = await this.api.invoke(inquiryControllerFindById, { id });

            // 기존 답변이 있으면 폼에 채우기
            if (this.inquiry.answer) {
                this.answerForm.patchValue({
                    answer: this.inquiry.answer,
                });
            }

            this.cdr.markForCheck();
        } catch (error) {
            console.error('1:1 문의 조회 실패', error);
            this.router.navigate(['/inquiry']);
        }
    }

    async onSubmitAnswer(): Promise<void> {
        if (this.answerForm.invalid) return;

        const data = this.answerForm.getRawValue();
        this.errorMessage = '';
        this.successMessage = '';

        try {
            this.inquiry = await this.api.invoke(inquiryControllerUpdateAnswer, {
                id: this.inquiry!.id,
                body: {
                    answer: data.answer,
                },
            });

            this.successMessage = '답변이 저장되었습니다.';
            this.cdr.markForCheck();
        } catch (error: any) {
            this.errorMessage = error?.error?.message || '답변 저장에 실패했습니다.';
        }
    }

    async onDelete(): Promise<void> {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await this.api.invoke(inquiryControllerRemove, {
                id: this.inquiry!.id,
            });
            this.router.navigate(['/inquiry']);
        } catch (error) {
            console.error('1:1 문의 삭제 실패', error);
        }
    }
}
