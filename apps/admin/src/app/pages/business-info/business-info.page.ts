import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Api, businessInfoControllerFindOne, businessInfoControllerUpsert, BusinessInfoDto } from "@api-client";
import { formatPhoneNumber } from "../../shared/utils/format-phone";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { FormViewComponent } from "../../components/form-view/form-view.component";
import { FormFieldComponent } from "../../components/form-field/form-field.component";

@Component({
    selector: 'app-business-info',
    templateUrl: './business-info.page.html',
    imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, FormViewComponent, FormFieldComponent],
})
export default class BusinessInfoPage implements OnInit {
    private readonly api = inject(Api);
    private readonly cdr = inject(ChangeDetectorRef);

    isLoaded = false;
    isEditMode = false;
    errorMessage = '';
    successMessage = '';

    /** 조회 모드에서 표시할 데이터 */
    businessInfo: BusinessInfoDto | null = null;

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

    /** 조회 모드에서 보여줄 필드 목록 */
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
            this.businessInfo = await this.api.invoke(businessInfoControllerFindOne, {});
        } catch (error) {
            // 데이터가 없는 경우 (첫 등록) — null 유지
            this.businessInfo = null;
        }
        this.isLoaded = true;
        this.cdr.markForCheck();
    }

    /** 수정 모드 진입 — 현재 데이터를 폼에 채움 */
    startEdit(): void {
        this.errorMessage = '';
        this.successMessage = '';

        if (this.businessInfo) {
            this.form.patchValue({
                name: this.businessInfo.name,
                representativeName: this.businessInfo.representativeName,
                registrationNumber: this.businessInfo.registrationNumber,
                address: this.businessInfo.address,
                contactNumber: this.businessInfo.contactNumber,
                email: this.businessInfo.email,
            });
        } else {
            this.form.reset();
        }

        this.isEditMode = true;
        this.cdr.markForCheck();
    }

    /** 수정 취소 — 조회 모드로 돌아감 */
    cancelEdit(): void {
        this.isEditMode = false;
        this.errorMessage = '';
        this.cdr.markForCheck();
    }

    /** 저장 — PATCH API 호출 후 조회 모드로 전환 */
    async onSubmit(): Promise<void> {
        if (this.form.invalid) return;
        this.errorMessage = '';
        this.successMessage = '';

        try {
            const data = this.form.getRawValue();
            this.businessInfo = await this.api.invoke(businessInfoControllerUpsert, {
                body: data,
            });
            this.isEditMode = false;
            this.successMessage = '사업자 정보가 저장되었습니다.';
            this.cdr.markForCheck();
        } catch (error: any) {
            this.errorMessage = error?.error?.message || '저장에 실패했습니다.';
            this.cdr.markForCheck();
        }
    }

    onPhoneInput(event: Event, controlName: 'contactNumber'): void {
        const input = event.target as HTMLInputElement;
        const formatted = formatPhoneNumber(input.value);
        this.form.patchValue({ [controlName]: formatted });
    }
}