import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Api, EventDto, PageInfoDto, preRegistrationControllerFindAvailableEvents } from '@api-client-shop';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-pre-registration',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './pre-registration.page.html',
})
export default class PreRegistrationPage implements OnInit {
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
      const result = await this.api.invoke(preRegistrationControllerFindAvailableEvents, {
        page: page,
        limit: 8,
      });
      this.events = result.items ?? [];
      this.pageInfo = result.pageInfo ?? null;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('사전 등록 가능 행사 조회 실패', error);
    }
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: {
        page,
      },
    });
  }

  selectEvent(event: EventDto): void {
    this.router.navigate(['/pre-registration', event.id]);
  }

  getDday(endDate: string | Date): string {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return '마감';
    return `D-${diff}`;
  }
}
