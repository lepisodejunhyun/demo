import { CommonModule, Location } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Api, inquiryControllerCreate, inquiryControllerFindById, inquiryControllerUpdate } from "@api-client-shop";
import { ToastrService } from 'ngx-toastr';
import { ContentWrapperComponent } from '../../../components/content-wrapper/content-wrapper.component';
import { FormFieldComponent } from '../../../components/form-field/form-field.component';
import { FormActionsComponent } from '../../../components/form-actions/form-actions.component';

@Component({
    selector: 'app-inquiry-form',
    imports: [CommonModule, ReactiveFormsModule, ContentWrapperComponent, FormFieldComponent, FormActionsComponent],
    templateUrl: './inquiry-form.page.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InquiryFormPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly location = inject(Location);
    private readonly toast = inject(ToastrService);

    id = input<string>();

    get isEditMode(): boolean { return !!this.id(); }

    form = new FormGroup({
        title: new FormControl('', {
            validators: [Validators.required, Validators.maxLength(100)],
            nonNullable: true,
        }),
        content: new FormControl('', {
            validators: [Validators.required, Validators.maxLength(2000)],
            nonNullable: true,
        }),
    });

    errorMessage = signal<string>('');

    async onSubmit(): Promise<void> {
        if (this.form.invalid) return;
        const body = this.form.getRawValue();
        try {
            if (this.isEditMode) {
                await this.api.invoke(inquiryControllerUpdate, {
                    id: this.id()!,
                    body,
                });
                this.router.navigate(['/support/inquiry', this.id()]);
            } else {
                await this.api.invoke(inquiryControllerCreate, { body });
                this.router.navigate(['/support/inquiry']);
            }
            this.toast.success(this.isEditMode ? '수정되었습니다.' : '문의가 등록되었습니다.');
        } catch (error: any) {
            this.toast.error(error?.error?.message || '요청이 실패했습니다.');
        }
    }

    async ngOnInit(): Promise<void> {
        const id = this.id();

        if (id) {
            try {
                const inquiry = await this.api.invoke(inquiryControllerFindById, { id });
                this.form.patchValue(inquiry);
            } catch (error) {
                console.error('문의 조회 실패', error);
                this.toast.error('데이터를 불러오지 못했습니다.');
                this.router.navigate(['/support/inquiry']);
            }
        }
    }

    goBack(): void {
        this.location.back();
    }
}
