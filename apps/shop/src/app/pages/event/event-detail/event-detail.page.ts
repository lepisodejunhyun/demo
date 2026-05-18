import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Api, eventControllerFindById, EventDto } from '@api-client-shop';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './event-detail.page.html',
})
export default class EventDetailPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  id = input<string>();

  event: EventDto | null = null;

  async ngOnInit(): Promise<void> {
    const id = this.id();

    if (!id) return;

    try {
      this.event = await this.api.invoke(eventControllerFindById, {
        id: id,
      });
      this.cdr.markForCheck();
    } catch (error) {
      console.error('행사 조회 실패', error);
      this.router.navigate(['/event']);
    }
  }

  goBack(): void {
    this.router.navigate(['/event']);
  }

  /** 행사 진행 상태를 계산 */
  getStatus(): { label: string; class: string } | null {
    if (!this.event) return null;
    const now = new Date();
    const start = new Date(this.event.startDate);
    const end = new Date(this.event.endDate);

    if (now > end) {
      return { label: '종료', class: 'bg-slate-100 text-slate-500' };
    } else if (now >= start) {
      return { label: '진행중', class: 'bg-emerald-100 text-emerald-700' };
    } else if (this.event.preRegStartDate && this.event.preRegEndDate) {
      const preStart = new Date(this.event.preRegStartDate);
      const preDeadline = new Date(this.event.preRegEndDate);
      preDeadline.setDate(preDeadline.getDate() + 1);
      if (now >= preStart && now < preDeadline) {
        return { label: '사전 등록중', class: 'bg-violet-100 text-violet-700' };
      }
    }
    return { label: '예정', class: 'bg-blue-100 text-blue-700' };
  }

  /** 현재 사전등록 기간인지 확인 */
  isPreRegistrationOpen(): boolean {
    if (!this.event?.preRegStartDate || !this.event?.preRegEndDate) return false;
    const now = new Date();
    const preStart = new Date(this.event.preRegStartDate);
    const preEnd = new Date(this.event.preRegEndDate);
    preEnd.setDate(preEnd.getDate() + 1);
    return now >= preStart && now < preEnd;
  }
}
