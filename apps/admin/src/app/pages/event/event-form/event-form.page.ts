import { CommonModule, Location } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { FormViewComponent } from "../../../components/form-view/form-view.component";
import { FormFieldComponent } from "../../../components/form-field/form-field.component";
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { Api, eventControllerCreate, eventControllerFindById, eventControllerUpdate } from "@api-client";
import { Router } from "@angular/router";
import { SupabaseService } from "../../../services/supabase.service";
import { formatPhoneNumber } from "../../../shared/utils/format-phone";

function eventDateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;
    const preRegStartDate = control.get('preRegStartDate')?.value;
    const preRegEndDate = control.get('preRegEndDate')?.value;

    const errors: ValidationErrors = {};

    if (startDate && endDate && endDate < startDate) {
        errors['endDateBeforeStart'] = true;
    }

    if (preRegEndDate) {
        if (preRegStartDate && preRegEndDate < preRegStartDate) {
            errors['preRegEndBeforeStart'] = true;
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
    imports: [CommonModule, PageHeaderComponent, BreadcrumbComponent, FormViewComponent, FormFieldComponent, FormsModule, ReactiveFormsModule]
})
export default class EventFormPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly location = inject(Location);
    private readonly supabaseService = inject(SupabaseService);

    id = input<string>();

    get isEditMode() { return !!this.id(); }

    breadcrumbs: Breadcrumb[] = [];

    errorMessage = '';

    imagePreview: string | null = null;
    selectedFile: File | null = null;
    uploading = false;

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

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            this.errorMessage = '이미지는 JPG, PNG 형식만 업로드할 수 있습니다.';
            input.value = '';
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.errorMessage = '이미지 파일 크기는 최대 5MB까지 업로드할 수 있습니다.';
            input.value = '';
            return;
        }

        this.errorMessage = '';
        this.selectedFile = file;
        this.imagePreview = URL.createObjectURL(file);
        this.cdr.markForCheck();
    }

    onPhoneInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const formatted = formatPhoneNumber(input.value);
        this.form.patchValue({ contactNumber: formatted });
    }

    async onSubmit() {
        if (this.form.invalid) return;

        try {
            // 새 이미지가 선택된 경우에만 업로드
            if (this.selectedFile) {
                this.uploading = true;
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
        } catch (error: any) {
            this.errorMessage = error?.error?.message || '요청이 실패했습니다.'
        } finally {
            this.uploading = false;
            this.cdr.markForCheck();
        }
    }

    async ngOnInit() {
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
                this.imagePreview = event.posterImage;
            }
            this.cdr.markForCheck();
        }


    }

    goBack(): void {
        this.location.back();
    }

}