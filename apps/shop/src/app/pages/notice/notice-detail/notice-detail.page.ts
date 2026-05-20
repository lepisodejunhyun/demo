import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Api, noticeControllerFindById, NoticeDto } from '@api-client-shop';
import { ToastrService } from 'ngx-toastr';
import { ContentWrapperComponent } from '../../../components/content-wrapper/content-wrapper.component';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';
import { ArticleViewComponent } from '../../../components/article-view/article-view.component';
import { LoadingSpinnerComponent } from '../../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-notice-detail',
  standalone: true,
  imports: [CommonModule, ContentWrapperComponent, BackButtonComponent, ArticleViewComponent, LoadingSpinnerComponent],
  templateUrl: './notice-detail.page.html',
})
export default class NoticeDetailPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastrService);

  id = input<string>();
  notice = signal<NoticeDto | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.id();
    if (!id) return;

    try {
      this.notice.set(await this.api.invoke(noticeControllerFindById, { id }));
    } catch (error) {
      console.error('공지사항 조회 실패', error);
      this.toast.error('데이터를 불러오지 못했습니다.');
      this.router.navigate(['/support/notice']);
    }
  }

  goBack(): void {
    this.router.navigate(['/support/notice']);
  }
}
