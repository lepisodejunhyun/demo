import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Api, noticeControllerFindAll, NoticeDto, PageInfoDto } from '@api-client-shop';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ContentWrapperComponent } from '../../components/content-wrapper/content-wrapper.component';

import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-notice',
  standalone: true,
  imports: [CommonModule, PaginationComponent, ContentWrapperComponent],
  templateUrl: './notice.page.html',
})
export default class NoticePage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastrService);

  notices = signal<NoticeDto[]>([]);
  pageInfo = signal<PageInfoDto | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const page = Number(params['page']) || 1;
      this.loadData(page);
    });
  }

  async loadData(page: number): Promise<void> {
    try {
      const result = await this.api.invoke(noticeControllerFindAll, {
        page,
        limit: 10,
      });
      this.notices.set(result.items ?? []);
      this.pageInfo.set(result.pageInfo ?? null);
    } catch (error) {
      console.error('공지사항 목록 조회 실패', error);
      this.toast.error('데이터를 불러오지 못했습니다.');
    }
  }

  onPageChange(page: number): void {
    this.router.navigate([], { queryParams: { page } });
  }

  goDetail(notice: NoticeDto): void {
    this.router.navigate(['/support/notice', notice.id]);
  }
}
