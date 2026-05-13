import { CommonModule, Location } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { Api, faqControllerCreate, faqControllerFindById, faqControllerUpdate } from "@api-client";
import { FormLayoutComponent } from "../../../components/form-layout/form-layout.component";
import { Breadcrumb } from "../../../components/detail-layout/detail-layout.component";

@Component({
    selector: 'app-faq-form',
    templateUrl: './faq-form.page.html',
    imports: [CommonModule, ReactiveFormsModule, FormLayoutComponent],
})
export default class FaqFormPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly location = inject(Location);

    id = input<string>();

    get isEditMode() { return !!this.id(); }

    breadcrumbs: Breadcrumb[] = [];

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
            if (this.isEditMode) {
                await this.api.invoke(faqControllerUpdate, {
                    id: this.id()!,
                    body: {
                        question: data.question,
                        answer: data.answer,
                    },
                });
                this.router.navigate(['/faq', this.id()]);
            } else {
                const faq = await this.api.invoke(faqControllerCreate, {
                    body: {
                        question: data.question,
                        answer: data.answer,
                    },
                });
                this.router.navigate(['/faq', faq.id]);
            }
        } catch (error: any) {
            this.errorMessage = error?.error?.message || '요청이 실패했습니다.'
        }
    }

    async ngOnInit() {
        const id = this.id();

        this.breadcrumbs = [
            { label: 'FAQ 관리', link: '/faq' },
            { label: this.isEditMode ? '수정' : '작성' },
        ];

        if (id) {
            const faq = await this.api.invoke(faqControllerFindById, {
                id: id,
            });
            this.form.patchValue({
                question: faq.question,
                answer: faq.answer,
            });
            this.cdr.markForCheck();
        }
    }

    goBack(): void {
        this.location.back();
    }

}