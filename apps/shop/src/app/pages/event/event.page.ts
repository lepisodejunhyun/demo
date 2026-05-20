import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Api, eventControllerFindAll, EventDto, PageInfoDto } from '@api-client-shop';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { CardGridComponent } from '../../components/card-grid/card-grid.component';
import { ImageCardComponent } from '../../components/image-card/image-card.component';
import { ContentWrapperComponent } from '../../components/content-wrapper/content-wrapper.component';
import { ToastrService } from 'ngx-toastr';
import { getEventStatus } from '../../shared/utils/event-status.util';

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, PaginationComponent, CardGridComponent, ImageCardComponent, ContentWrapperComponent],
  templateUrl: './event.page.html',
})
export default class EventPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastrService);

  events = signal<EventDto[]>([]);
  pageInfo = signal<PageInfoDto | null>(null);

  readonly getEventStatus = getEventStatus;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const page = Number(params['page']) || 1;
      this.loadData(page);
    });
  }

  async loadData(page: number): Promise<void> {
    try {
      const result = await this.api.invoke(eventControllerFindAll, {
        page,
        limit: 8,
      });
      this.events.set(result.items ?? []);
      this.pageInfo.set(result.pageInfo ?? null);
    } catch (error) {
      console.error('행사 목록 조회 실패', error);
      this.toast.error('데이터를 불러오지 못했습니다.');
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
}
