import { CommonModule, Location } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { FormViewComponent } from "../../../components/form-view/form-view.component";
import { FormFieldComponent } from "../../../components/form-field/form-field.component";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { Api, eventControllerCreate, eventControllerFindById, eventControllerUpdate } from "@api-client";
import { Router } from "@angular/router";
import { SupabaseService } from "../../../services/supabase.service";

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
            ],
            nonNullable: true,
        }),
        content: new FormControl('', {
            validators: [
                Validators.required,
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
        location: new FormControl<string | null>(null),
        contactNumber: new FormControl<string | null>(null),
        preRegStartDate: new FormControl<string | null>(null),
        preRegEndDate: new FormControl<string | null>(null),
    });

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.selectedFile = file;
        this.imagePreview = URL.createObjectURL(file);
        this.cdr.markForCheck();
    }

    onPhoneInput(event: Event) {
        const input = event.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, '');

        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 7) {
            value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
        } else if (value.length > 3) {
            value = `${value.slice(0, 3)}-${value.slice(3)}`;
        }
        this.form.patchValue({ contactNumber: value });
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