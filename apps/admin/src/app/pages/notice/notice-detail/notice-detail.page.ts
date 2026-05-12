import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { Api, noticeControllerFindById, noticeControllerRemove, NoticeDto } from "@api-client";

@Component({
    selector: 'app-notice-detail',
    templateUrl: 'notice-detail.page.html',
    imports: [CommonModule, RouterLink]
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

    async onDelete() {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await this.api.invoke(noticeControllerRemove, {
                id: this.notice!.id
            });
            this.router.navigate(['/notice']);
        } catch (error) {
            console.error('공지사항 삭제 실패', error);
        }
    }
}