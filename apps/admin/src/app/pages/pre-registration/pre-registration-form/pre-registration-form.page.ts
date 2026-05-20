import { CommonModule, Location } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from "@angular/core";
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
import { ToastrService } from 'ngx-toastr';
import { StatusBadgeComponent } from "../../../components/status-badge/status-badge.component";
import { DialogService } from "../../../components/confirm-dialog/confirm-dialog.service";

@Component({
    selector: 'app-pre-registration-form',
    templateUrl: './pre-registration-form.page.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, PageHeaderComponent, BreadcrumbComponent, FormViewComponent, FormFieldComponent, FormInputComponent, StatusBadgeComponent],
})
export default class PreRegistrationFormPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly location = inject(Location);
    private readonly toast = inject(ToastrService);
    private readonly dialog = inject(DialogService);

    id = input<string>();


    get isEditMode(): boolean { return !!this.id(); }

    breadcrumbs = signal<Breadcrumb[]>([]);

    availableEvents = signal<AvailableEventDto[]>([]);
    eventTitle = signal<string>('');
    termsList = signal<{ id: string; title: string; isRequired: boolean; content: string; agreed: boolean }[]>([]);

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
                Validators.maxLength(13),
            ],
            nonNullable: true,
        }),
    });

    errorMessage = signal<string>('');

    onPhoneInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const formatted = formatPhoneNumber(input.value);
        this.form.patchValue({ contactNumber: formatted });
    }

    async onSubmit(): Promise<void> {
        if (this.form.invalid) return;
        const { eventId, applicantName, contactNumber } = this.form.getRawValue();
        try {
            if (this.isEditMode) {
                if (!await this.dialog.confirm({ title: '수정 확인', message: '정말 수정하시겠습니까?', variant: 'warning' })) return;
                await this.api.invoke(preRegistrationControllerUpdate, {
                    id: this.id()!,
                    body: {
                        applicantName,
                        contactNumber,
                    },
                });
                this.router.navigate(['/pre-registration', this.id()]);
            } else {
                const agreedTermsIds = this.termsList().filter(t => t.agreed).map(t => t.id);
                const item = await this.api.invoke(preRegistrationControllerCreate, {
                    body: {
                        eventId,
                        applicantName,
                        contactNumber,
                        agreedTermsIds,
                    },
                });
                this.router.navigate(['/pre-registration', item.id]);
            }
            this.toast.success('저장되었습니다.');
        } catch (error: any) {
            this.errorMessage.set(error?.error?.message || '요청이 실패했습니다.');
        }
    }

    async ngOnInit(): Promise<void> {
        const id = this.id();

        this.breadcrumbs.set([
            { label: '사전 등록 관리', link: '/pre-registration' },
            { label: this.isEditMode ? '수정' : '등록' },
        ]);

        if (!this.isEditMode) {
            try {
                this.availableEvents.set(await this.api.invoke(preRegistrationControllerFindAvailableEvents, {}));
                const termsResult = await this.api.invoke(termsControllerFindAll, { page: 1, limit: 100 });
                this.termsList.set((termsResult.items ?? []).map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    isRequired: t.isRequired ?? true,
                    content: t.content ?? '',
                    agreed: false,
                })));
            } catch (error) {
                console.error('초기 데이터 조회 실패', error);
                this.toast.error('데이터를 불러오지 못했습니다.');
            }
        }

        if (id) {
            try {
                const item = await this.api.invoke(preRegistrationControllerFindById, {
                    id,
                });
                this.eventTitle.set(item.eventTitle);
                this.form.patchValue(item);
            } catch (error) {
                console.error('사전 등록 조회 실패', error);
                this.toast.error('데이터를 불러오지 못했습니다.');
                this.router.navigate(['/pre-registration']);
            }
        }
    }

    goBack(): void {
        this.location.back();
    }
}
