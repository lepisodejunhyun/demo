import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Api, eventControllerFindAll, EventDto, PageInfoDto } from '@api-client-shop';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-list.page.html',
})
export default class EventListPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);

  events: EventDto[] = [];
  pageInfo: PageInfoDto | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const page = Number(params['page']) || 1;
      this.loadData(page);
    });
  }

  async loadData(page: number): Promise<void> {
    try {
      const result = await this.api.invoke(eventControllerFindAll, {
        page: page,
        limit: 8,
      });
      this.events = result.items ?? [];
      this.pageInfo = result.pageInfo ?? null;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('행사 목록 조회 실패', error);
    }
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
    });
  }

  goDetail(event: EventDto): void {
    this.router.navigate(['/event', event.id]);
  }

  /** 행사 진행 상태를 계산 */
  getStatus(event: EventDto): { label: string; class: string } {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    if (now < start) {
      return { label: '예정', class: 'bg-blue-100 text-blue-700' };
    } else if (now > end) {
      return { label: '종료', class: 'bg-slate-100 text-slate-500' };
    } else {
      return { label: '진행중', class: 'bg-emerald-100 text-emerald-700' };
    }
  }
}
