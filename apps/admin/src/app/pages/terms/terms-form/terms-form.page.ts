import { CommonModule, Location } from "@angular/common";
import { Component, inject, input, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Api, termsControllerCreate, termsControllerFindById, termsControllerUpdate } from "@api-client";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { FormViewComponent } from "../../../components/form-view/form-view.component";
import { FormFieldComponent } from "../../../components/form-field/form-field.component";
import { FormInputComponent } from "../../../components/form-input/form-input.component";
import { FormTextareaComponent } from "../../../components/form-textarea/form-textarea.component";
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-terms-form',
    templateUrl: './terms-form.page.html',
    imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, BreadcrumbComponent, FormViewComponent, FormFieldComponent, FormInputComponent, FormTextareaComponent],
})
export default class TermsFormPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly location = inject(Location);
    private readonly toast = inject(ToastrService);

    id = input<string>();

    get isEditMode(): boolean { return !!this.id(); }

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
        }),
        isRequired: new FormControl(true, {
            nonNullable: true,
        }),
    });

    errorMessage = signal<string>('');

    async onSubmit(): Promise<void> {
        if (this.form.invalid) return;
        const body = this.form.getRawValue();
        try {
            if (this.isEditMode) {
                await this.api.invoke(termsControllerUpdate, {
                    id: this.id()!,
                    body,
                });
                this.router.navigate(['/terms', this.id()]);
            } else {
                const terms = await this.api.invoke(termsControllerCreate, { body });
                this.router.navigate(['/terms', terms.id]);
            }
            this.toast.success('저장되었습니다.');
        } catch (error: any) {
            this.errorMessage.set(error?.error?.message || '요청이 실패했습니다.');
        }
    }

    async ngOnInit(): Promise<void> {
        const id = this.id();

        this.breadcrumbs = [
            { label: '약관 관리', link: '/terms' },
            { label: this.isEditMode ? '수정' : '작성' },
        ];

        if (id) {
            const terms = await this.api.invoke(termsControllerFindById, { id });
            this.form.patchValue(terms);
        }
    }

    goBack(): void {
        this.location.back();
    }

}
