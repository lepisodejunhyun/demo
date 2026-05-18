import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Api, noticeControllerFindAll, NoticeDto, PageInfoDto } from '@api-client-shop';
import { PaginationComponent } from '../../components/pagination/pagination.component';

@Component({
  selector: 'app-notice',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './notice.page.html',
})
export default class NoticePage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);

  notices: NoticeDto[] = [];
  pageInfo: PageInfoDto | null = null;
  Math = Math;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const page = Number(params['page']) || 1;
      this.loadData(page);
    });
  }

  async loadData(page: number): Promise<void> {
    try {
      const result = await this.api.invoke(noticeControllerFindAll, {
        page: page,
        limit: 10,
      });
      this.notices = result.items ?? [];
      this.pageInfo = result.pageInfo ?? null;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('공지사항 목록 조회 실패', error);
    }
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: {
        page,
      },
    });
  }

  goDetail(notice: NoticeDto): void {
    this.router.navigate(['/support/notice', notice.id]);
  }
}
