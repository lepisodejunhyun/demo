import { CommonModule, Location } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import {
    Api,
    AvailableEventDto,
    preRegistrationControllerCreate,
    preRegistrationControllerFindAvailableEvents,
    preRegistrationControllerFindById,
    preRegistrationControllerUpdate,
    termsControllerFindAll,
} from "@api-client";
import { formatPhoneNumber } from "../../../shared/utils/format-phone";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { FormViewComponent } from "../../../components/form-view/form-view.component";
import { FormFieldComponent } from "../../../components/form-field/form-field.component";
import { FormInputComponent } from "../../../components/form-input/form-input.component";

@Component({
    selector: 'app-pre-registration-form',
    templateUrl: './pre-registration-form.page.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, PageHeaderComponent, BreadcrumbComponent, FormViewComponent, FormFieldComponent, FormInputComponent],
})
export default class PreRegistrationFormPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly location = inject(Location);

    id = input<string>();

    get isEditMode(): boolean { return !!this.id(); }

    breadcrumbs: Breadcrumb[] = [];

    availableEvents: AvailableEventDto[] = [];
    eventTitle = '';
    termsList: { id: string; title: string; isRequired: boolean; content: string; agreed: boolean }[] = [];

    form = new FormGroup({
        eventId: new FormControl('', {
            validators: [Validators.required],
            nonNullable: true,
        }),
        applicantName: new FormControl('', {
            validators: [
                Validators.required,
                Validators.maxLength(20),
            ],
            nonNullable: true,
        }),
        contactNumber: new FormControl('', {
            validators: [
                Validators.required,
                Validators.maxLength(20),
            ],
            nonNullable: true,
        }),
    });

    errorMessage = '';

    onPhoneInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const formatted = formatPhoneNumber(input.value);
        this.form.patchValue({ contactNumber: formatted });
    }

    async onSubmit(): Promise<void> {
        if (this.form.invalid) return;
        const data = this.form.getRawValue();
        try {
            if (this.isEditMode) {
                await this.api.invoke(preRegistrationControllerUpdate, {
                    id: this.id()!,
                    body: {
                        applicantName: data.applicantName,
                        contactNumber: data.contactNumber,
                    },
                });
                this.router.navigate(['/pre-registration', this.id()]);
            } else {
                const agreedTermsIds = this.termsList.filter(t => t.agreed).map(t => t.id);
                const item = await this.api.invoke(preRegistrationControllerCreate, {
                    body: {
                        eventId: data.eventId,
                        applicantName: data.applicantName,
                        contactNumber: data.contactNumber,
                        agreedTermsIds,
                    },
                });
                this.router.navigate(['/pre-registration', item.id]);
            }
        } catch (error: any) {
            this.errorMessage = error?.error?.message || '요청이 실패했습니다.';
        }
    }

    async ngOnInit(): Promise<void> {
        const id = this.id();

        this.breadcrumbs = [
            { label: '사전 등록 관리', link: '/pre-registration' },
            { label: this.isEditMode ? '수정' : '등록' },
        ];

        if (!this.isEditMode) {
            try {
                this.availableEvents = await this.api.invoke(preRegistrationControllerFindAvailableEvents, {});
                const termsResult = await this.api.invoke(termsControllerFindAll, { page: 1, limit: 100 });
                this.termsList = (termsResult.items ?? []).map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    isRequired: t.isRequired ?? true,
                    content: t.content ?? '',
                    agreed: false,
                }));
                this.cdr.markForCheck();
            } catch (error) {
                console.error('초기 데이터 조회 실패', error);
            }
        }

        if (id) {
            try {
                const item = await this.api.invoke(preRegistrationControllerFindById, {
                    id: id,
                });
                this.eventTitle = item.eventTitle;
                this.form.patchValue({
                    eventId: item.eventId,
                    applicantName: item.applicantName,
                    contactNumber: item.contactNumber,
                });
                // this.form.get('eventId')?.disable();
                this.cdr.markForCheck();
            } catch (error) {
                console.error('사전 등록 조회 실패', error);
                this.router.navigate(['/pre-registration']);
            }
        }
    }

    goBack(): void {
        this.location.back();
    }
}
