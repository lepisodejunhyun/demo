import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, input, OnInit } from '@angular/core';
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
import { formatPhoneNumber } from '../../../shared/utils/format-phone';

@Component({
  selector: 'app-pre-registration-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './pre-registration-form.page.html',
})
export default class PreRegistrationFormPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly authService = inject(AuthService);

  eventId = input<string>();

  event: EventDto | null = null;
  terms: TermsDto[] = [];

  applicantName = '';
  contactNumber = '';
  agreedTermsIds: string[] = [];
  errorMessage = '';
  loading = false;
  expandedTermsId: string | null = null;

  async ngOnInit(): Promise<void> {
    const id = this.eventId();
    if (!id) return;

    try {
      const [event, terms] = await Promise.all([
        this.api.invoke(eventControllerFindById, { id }),
        this.api.invoke(termsControllerFindAll, {}),
      ]);
      this.event = event;
      this.terms = terms;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('초기 데이터 조회 실패', error);
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
    this.contactNumber = formatPhoneNumber(input.value);
  }

  goBack(): void {
    this.router.navigate(['/pre-registration']);
  }

  async submit(): Promise<void> {
    if (!this.event) return;
    if (!this.applicantName.trim() || !this.contactNumber.trim()) {
      this.errorMessage = '신청자 이름과 연락처를 입력해주세요.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.api.invoke(preRegistrationControllerCreate, {
        body: {
          eventId: this.event.id,
          applicantName: this.applicantName.trim(),
          contactNumber: this.contactNumber.trim(),
          agreedTermsIds: this.agreedTermsIds,
        },
      });
      this.router.navigate(['/pre-registration/complete']);
    } catch (error: any) {
      this.errorMessage = error?.error?.message || '사전 등록에 실패했습니다.';
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
