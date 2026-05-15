import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Api, noticeControllerFindById, NoticeDto } from '@api-client-shop';

@Component({
  selector: 'app-notice-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notice-detail.page.html',
})
export default class NoticeDetailPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  id = input<string>();

  notice: NoticeDto | null = null;

  async ngOnInit() {
    const id = this.id();

    if (!id) return;

    try {
      this.notice = await this.api.invoke(noticeControllerFindById, {
        id: id,
      });
      this.cdr.markForCheck();
    } catch (error) {
      console.error('공지사항 조회 실패', error);
      this.router.navigate(['/notice']);
    }
  }

  goBack(): void {
    this.router.navigate(['/notice']);
  }
}
