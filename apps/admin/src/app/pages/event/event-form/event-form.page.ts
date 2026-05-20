import { CommonModule, Location } from "@angular/common";
import { Component, inject, input, OnInit, signal } from "@angular/core";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { FormViewComponent } from "../../../components/form-view/form-view.component";
import { FormFieldComponent } from "../../../components/form-field/form-field.component";
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { Api, eventControllerCreate, eventControllerFindById, eventControllerUpdate } from "@api-client";
import { Router } from "@angular/router";
import { SupabaseService } from "../../../services/supabase.service";
import { formatPhoneNumber } from "../../../shared/utils/format-phone";
import { FormInputComponent } from "../../../components/form-input/form-input.component";
import { FormTextareaComponent } from "../../../components/form-textarea/form-textarea.component";
import { ToastrService } from 'ngx-toastr';
import { ImageUploadComponent } from "../../../components/image-upload/image-upload.component";

function eventDateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;
    const operatingStartTime = control.get('operatingStartTime')?.value;
    const operatingEndTime = control.get('operatingEndTime')?.value;
    const preRegStartDate = control.get('preRegStartDate')?.value;
    const preRegEndDate = control.get('preRegEndDate')?.value;

    const errors: ValidationErrors = {};

    // 행사 종료일 < 행사 시작일
    if (startDate && endDate && endDate < startDate) {
        errors['endDateBeforeStart'] = true;
    }

    // 운영 종료 시간 <= 운영 시작 시간
    if (operatingStartTime && operatingEndTime && operatingEndTime <= operatingStartTime) {
        errors['operatingEndNotAfterStart'] = true;
    }

    // 사전등록 날짜 한쪽만 입력된 경우
    if (preRegStartDate && !preRegEndDate) {
        errors['preRegStartWithoutEnd'] = true;
    }
    if (!preRegStartDate && preRegEndDate) {
        errors['preRegEndWithoutStart'] = true;
    }

    // 사전등록 날짜 범위 검증 (둘 다 입력된 경우)
    if (preRegStartDate && preRegEndDate) {
        if (preRegEndDate < preRegStartDate) {
            errors['preRegEndBeforeStart'] = true;
        }
        if (startDate && preRegStartDate >= startDate) {
            errors['preRegStartAfterEventStart'] = true;
        }
        if (startDate && preRegEndDate > startDate) {
            errors['preRegEndAfterEventStart'] = true;
        }
    }

    return Object.keys(errors).length > 0 ? errors : null;
}

@Component({
    selector: 'app-event-form',
    templateUrl: 'event-form.page.html',
    imports: [CommonModule, PageHeaderComponent, BreadcrumbComponent, FormViewComponent, FormFieldComponent, FormsModule, ReactiveFormsModule, FormInputComponent, FormTextareaComponent, ImageUploadComponent]
})
export default class EventFormPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly location = inject(Location);
    private readonly supabaseService = inject(SupabaseService);
    private readonly toast = inject(ToastrService);

    id = input<string>();

    get isEditMode(): boolean { return !!this.id(); }

    breadcrumbs: Breadcrumb[] = [];

    errorMessage = signal<string>('');

    imagePreview = signal<string | null>(null);
    selectedFile: File | null = null;
    uploading = signal<boolean>(false);

    form = new FormGroup({
        title: new FormControl('', {
            validators: [
                Validators.required,
                Validators.maxLength(100),
            ],
            nonNullable: true,
        }),
        content: new FormControl('', {
            validators: [
                Validators.required,
                Validators.maxLength(2000),
            ],
            nonNullable: true,
        }),
        startDate: new FormControl('', {
            validators: [
                Validators.required,
            ],
            nonNullable: true,
        }),
        endDate: new FormControl('', {
            validators: [
                Validators.required,
            ],
            nonNullable: true,
        }),
        operatingStartTime: new FormControl('', {
            validators: [
                Validators.required,
            ],
            nonNullable: true,
        }),
        operatingEndTime: new FormControl('', {
            validators: [
                Validators.required,
            ],
            nonNullable: true,
        }),
        posterImage: new FormControl<string | null>(null),
        location: new FormControl<string | null>(null, [Validators.maxLength(200)]),
        contactNumber: new FormControl<string | null>(null, [Validators.maxLength(13)]),
        preRegStartDate: new FormControl<string | null>(null),
        preRegEndDate: new FormControl<string | null>(null),
    }, { validators: eventDateRangeValidator });

    onFileSelected(file: File): void {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            this.toast.warning('이미지는 JPG, PNG 형식만 업로드할 수 있습니다.');
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.toast.warning('이미지 파일 크기는 최대 5MB까지 업로드할 수 있습니다.');
            return;
        }

        this.errorMessage.set('');
        this.selectedFile = file;
        this.imagePreview.set(URL.createObjectURL(file));
    }

    onPhoneInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const formatted = formatPhoneNumber(input.value);
        this.form.patchValue({ contactNumber: formatted });
    }

    async onSubmit(): Promise<void> {
        if (this.form.invalid) return;

        try {
            // 새 이미지가 선택된 경우에만 업로드
            if (this.selectedFile) {
                this.uploading.set(true);
                const url = await this.supabaseService.uploadImage(this.selectedFile, 'events');
                this.form.patchValue({ posterImage: url });
            }

            const data = this.form.getRawValue();

            if (this.isEditMode) {
                await this.api.invoke(eventControllerUpdate, {
                    id: this.id()!,
                    body: data,
                });
                this.router.navigate(['event', this.id()]);
            } else {
                const event = await this.api.invoke(eventControllerCreate, {
                    body: data,
                });
                this.router.navigate(['/event', event.id]);
            }
            this.toast.success('저장되었습니다.');
        } catch (error: any) {
            this.errorMessage.set(error?.error?.message || '요청이 실패했습니다.');
        } finally {
            this.uploading.set(false);
        }
    }

    async ngOnInit(): Promise<void> {
        const id = this.id();

        this.breadcrumbs = [
            { label: '행사 관리', link: '/event' },
            { label: this.isEditMode ? '수정' : '등록' },
        ];

        if (id) {
            const event = await this.api.invoke(eventControllerFindById, {
                id,
            });
            this.form.patchValue(event);
            if (event.posterImage) {
                this.imagePreview.set(event.posterImage);
            }
        }


    }

    goBack(): void {
        this.location.back();
    }

}