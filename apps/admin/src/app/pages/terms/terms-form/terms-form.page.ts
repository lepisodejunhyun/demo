import { CommonModule, Location } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Api, termsControllerCreate, termsControllerFindById, termsControllerUpdate } from "@api-client";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { FormViewComponent } from "../../../components/form-view/form-view.component";
import { FormFieldComponent } from "../../../components/form-field/form-field.component";

@Component({
    selector: 'app-terms-form',
    templateUrl: './terms-form.page.html',
    imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, BreadcrumbComponent, FormViewComponent, FormFieldComponent],
})
export default class TermsFormPage implements OnInit {
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
                await this.api.invoke(termsControllerUpdate, {
                    id: this.id()!,
                    body: {
                        title: data.title,
                        content: data.content
                    },
                });
                this.router.navigate(['/terms', this.id()]);
            } else {
                const terms = await this.api.invoke(termsControllerCreate, {
                    body: {
                        title: data.title,
                        content: data.content
                    },
                });
                this.router.navigate(['/terms', terms.id]);
            }
        } catch (error: any) {
            this.errorMessage = error?.error?.message || '요청이 실패했습니다.';
        }
    }

    async ngOnInit() {
        const id = this.id();

        this.breadcrumbs = [
            { label: '약관 관리', link: '/terms' },
            { label: this.isEditMode ? '수정' : '작성' },
        ];

        if (id) {
            const terms = await this.api.invoke(termsControllerFindById, {
                id: id,
            });
            this.form.patchValue({
                title: terms.title,
                content: terms.content,
            });
            this.cdr.markForCheck();
        }
    }

    goBack(): void {
        this.location.back();
    }

}
