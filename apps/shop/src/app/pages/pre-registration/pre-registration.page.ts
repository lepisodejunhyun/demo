import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Api, EventDto, PageInfoDto, preRegistrationControllerFindAvailableEvents } from '@api-client-shop';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { CardGridComponent } from '../../components/card-grid/card-grid.component';
import { ImageCardComponent } from '../../components/image-card/image-card.component';
import { ContentWrapperComponent } from '../../components/content-wrapper/content-wrapper.component';
import { ToastrService } from 'ngx-toastr';
import { getDday } from '../../shared/utils/event-status.util';

@Component({
  selector: 'app-pre-registration',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, PaginationComponent, CardGridComponent, ImageCardComponent, ContentWrapperComponent],
  templateUrl: './pre-registration.page.html',
})
export default class PreRegistrationPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastrService);

  events = signal<EventDto[]>([]);
  pageInfo = signal<PageInfoDto | null>(null);

  readonly getDday = getDday;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const page = Number(params['page']) || 1;
      this.loadData(page);
    });
  }

  async loadData(page: number): Promise<void> {
    try {
      const result = await this.api.invoke(preRegistrationControllerFindAvailableEvents, {
        page,
        limit: 8,
      });
      this.events.set(result.items ?? []);
      this.pageInfo.set(result.pageInfo ?? null);
    } catch (error) {
      console.error('사전 등록 가능 행사 조회 실패', error);
      this.toast.error('데이터를 불러오지 못했습니다.');
    }
  }

  onPageChange(page: number): void {
    this.router.navigate([], { queryParams: { page } });
  }

  selectEvent(event: EventDto): void {
    this.router.navigate(['/pre-registration', event.id]);
  }
}
