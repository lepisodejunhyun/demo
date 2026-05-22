import { CommonModule, Location } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Api, faqControllerCreate, faqControllerFindById, faqControllerUpdate } from "@api-client";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { FormViewComponent } from "../../../components/form-view/form-view.component";
import { FormFieldComponent } from "../../../components/form-field/form-field.component";
import { FormInputComponent } from "../../../components/form-input/form-input.component";
import { FormTextareaComponent } from "../../../components/form-textarea/form-textarea.component";
import { ToastrService } from 'ngx-toastr';
import { DialogService } from "../../../components/confirm-dialog/confirm-dialog.service";

@Component({
    selector: 'app-faq-form',
    templateUrl: './faq-form.page.html',
    imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, BreadcrumbComponent, FormViewComponent, FormFieldComponent, FormInputComponent, FormTextareaComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FaqFormPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly location = inject(Location);
    private readonly toast = inject(ToastrService);
    private readonly dialog = inject(DialogService)

    id = input<string>();

    get isEditMode(): boolean { return !!this.id(); }

    breadcrumbs = signal<Breadcrumb[]>([]);

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

    errorMessage = signal<string>('');

    async onSubmit(): Promise<void> {
        if (this.form.invalid) return;
        const body = this.form.getRawValue();

        try {
            if (this.isEditMode) {
                if (!await this.dialog.confirm({ title: '수정 확인', message: '수정하시겠습니까?', variant: 'warning' })) return;
                await this.api.invoke(faqControllerUpdate, {
                    id: this.id()!,
                    body,
                });
                this.router.navigate(['/faq', this.id()]);
            } else {
                const faq = await this.api.invoke(faqControllerCreate, { body });
                this.router.navigate(['/faq', faq.id]);
            }
            this.toast.success('저장되었습니다.');
        } catch (error: any) {
            this.errorMessage.set(error?.error?.message || '요청이 실패했습니다.');
        }
    }

    async ngOnInit(): Promise<void> {
        const id = this.id();

        this.breadcrumbs.set([
            { label: 'FAQ 관리', link: '/faq' },
            { label: this.isEditMode ? '수정' : '작성' },
        ]);

        if (id) {
            const faq = await this.api.invoke(faqControllerFindById, { id });
            this.form.patchValue(faq);
        }
    }

    goBack(): void {
        this.location.back();
    }

}
