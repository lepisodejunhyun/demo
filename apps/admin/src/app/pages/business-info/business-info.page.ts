import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Api, businessInfoControllerFindOne, businessInfoControllerUpsert, BusinessInfoDto } from "@api-client";
import { formatPhoneNumber } from "@org/shared/utils";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { FormViewComponent } from "../../components/form-view/form-view.component";
import { FormFieldComponent } from "../../components/form-field/form-field.component";
import { FormInputComponent } from "../../components/form-input/form-input.component";
import { ToastrService } from 'ngx-toastr';
import { DetailFieldComponent } from "../../components/detail-field/detail-field.component";
import { EmptyStateComponent } from "../../components/empty-state/empty-state.component";

@Component({
    selector: 'app-business-info',
    templateUrl: './business-info.page.html',
    imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, FormViewComponent, FormFieldComponent, FormInputComponent, DetailFieldComponent, EmptyStateComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BusinessInfoPage implements OnInit {
    private readonly api = inject(Api);
    private readonly toast = inject(ToastrService);

    isLoaded = signal<boolean>(false);
    isEditMode = signal<boolean>(false);
    errorMessage = signal<string>('');
    successMessage = signal<string>('');

    businessInfo = signal<BusinessInfoDto | null>(null);

    form = new FormGroup({
        name: new FormControl('', {
            validators: [Validators.required, Validators.maxLength(50)],
            nonNullable: true,
        }),
        representativeName: new FormControl('', {
            validators: [Validators.required, Validators.maxLength(20)],
            nonNullable: true,
        }),
        registrationNumber: new FormControl('', {
            validators: [Validators.required, Validators.maxLength(12)],
            nonNullable: true,
        }),
        address: new FormControl('', {
            validators: [Validators.required, Validators.maxLength(200)],
            nonNullable: true,
        }),
        contactNumber: new FormControl('', {
            validators: [Validators.required, Validators.maxLength(20)],
            nonNullable: true,
        }),
        email: new FormControl('', {
            validators: [Validators.required, Validators.email, Validators.maxLength(50)],
            nonNullable: true,
        }),
    });

    readonly displayFields = [
        { label: '상호명', key: 'name' as keyof BusinessInfoDto },
        { label: '대표자명', key: 'representativeName' as keyof BusinessInfoDto },
        { label: '사업자등록번호', key: 'registrationNumber' as keyof BusinessInfoDto },
        { label: '주소', key: 'address' as keyof BusinessInfoDto },
        { label: '연락처', key: 'contactNumber' as keyof BusinessInfoDto },
        { label: '이메일', key: 'email' as keyof BusinessInfoDto },
    ];

    async ngOnInit(): Promise<void> {
        await this.loadData();
    }

    private async loadData(): Promise<void> {
        try {
            this.businessInfo.set(await this.api.invoke(businessInfoControllerFindOne, {}));
        } catch (error) {
            this.businessInfo.set(null);
        }
        this.isLoaded.set(true);
    }

    startEdit(): void {
        this.errorMessage.set('');
        this.successMessage.set('');

        const info = this.businessInfo();
        if (info) {
            this.form.patchValue(info);
        } else {
            this.form.reset();
        }

        this.isEditMode.set(true);
    }

    cancelEdit(): void {
        this.isEditMode.set(false);
        this.errorMessage.set('');
    }

    async onSubmit(): Promise<void> {
        if (this.form.invalid) return;
        this.errorMessage.set('');
        this.successMessage.set('');

        try {
            const body = this.form.getRawValue();
            this.businessInfo.set(await this.api.invoke(businessInfoControllerUpsert, {
                body,
            }));
            this.isEditMode.set(false);
            this.toast.success('사업자 정보가 저장되었습니다.');
        } catch (error: any) {
            this.toast.error(error?.error?.message || '저장에 실패했습니다.');
        }
    }

    onPhoneInput(event: Event, controlName: 'contactNumber'): void {
        const input = event.target as HTMLInputElement;
        const formatted = formatPhoneNumber(input.value);
        this.form.patchValue({ [controlName]: formatted });
    }
}