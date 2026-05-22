import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Api,
  EventDto,
  eventControllerFindById,
  preRegistrationControllerCreate,
  termsControllerFindAll,
  TermsDto,
} from '@api-client-shop';
import { AuthService } from '../../../shared/services/auth.service';
import { formatPhoneNumber } from '@org/shared/utils';
import { ToastrService } from 'ngx-toastr';
import { PageHeaderComponent } from '../../../components/page-header/page-header.component';
import { ContentWrapperComponent } from '../../../components/content-wrapper/content-wrapper.component';
import { FormFieldComponent } from '../../../components/form-field/form-field.component';
import { FormActionsComponent } from '../../../components/form-actions/form-actions.component';
import { LoadingSpinnerComponent } from '../../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-pre-registration-form',
  imports: [CommonModule, FormsModule, PageHeaderComponent, ContentWrapperComponent, FormFieldComponent, FormActionsComponent, LoadingSpinnerComponent],
  templateUrl: './pre-registration-form.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PreRegistrationFormPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastrService);

  eventId = input<string>();

  event = signal<EventDto | null>(null);
  terms = signal<TermsDto[]>([]);

  applicantName = '';
  contactNumber = '';
  agreedTermsIds: string[] = [];
  errorMessage = signal('');
  loading = signal(false);
  expandedTermsId: string | null = null;

  async ngOnInit(): Promise<void> {
    const id = this.eventId();
    if (!id) return;

    try {
      const [event, terms] = await Promise.all([
        this.api.invoke(eventControllerFindById, { id }),
        this.api.invoke(termsControllerFindAll, {}),
      ]);
      this.event.set(event);
      this.terms.set(terms);
    } catch (error) {
      console.error('초기 데이터 조회 실패', error);
      this.toast.error('데이터를 불러오지 못했습니다.');
      this.router.navigate(['/pre-registration']);
    }
  }

  toggleTerms(termsId: string): void {
    const index = this.agreedTermsIds.indexOf(termsId);
    if (index > -1) {
      this.agreedTermsIds.splice(index, 1);
    } else {
      this.agreedTermsIds.push(termsId);
    }
  }

  isTermsAgreed(termsId: string): boolean {
    return this.agreedTermsIds.includes(termsId);
  }

  toggleExpandTerms(termsId: string): void {
    this.expandedTermsId = this.expandedTermsId === termsId ? null : termsId;
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatPhoneNumber(input.value);
    input.value = formatted;
    this.contactNumber = formatted;
  }

  goBack(): void {
    this.router.navigate(['/pre-registration']);
  }

  async submit(): Promise<void> {
    const event = this.event();
    if (!event) return;
    if (!this.applicantName.trim() || !this.contactNumber.trim()) {
      this.errorMessage.set('신청자 이름과 연락처를 입력해주세요.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.api.invoke(preRegistrationControllerCreate, {
        body: {
          eventId: event.id,
          applicantName: this.applicantName.trim(),
          contactNumber: this.contactNumber.trim(),
          agreedTermsIds: this.agreedTermsIds,
        },
      });
      this.toast.success('사전 등록이 완료되었습니다.');
      this.router.navigate(['/pre-registration/complete']);
    } catch (error: any) {
      this.toast.error(error?.error?.message || '사전 등록에 실패했습니다.');
      this.loading.set(false);
    }
  }
}
