import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Api, noticeControllerFindById, noticeControllerRemove, NoticeDto } from "@api-client";
import { Breadcrumb, DetailLayoutComponent } from "../../../components/detail-layout/detail-layout.component";

@Component({
    selector: 'app-notice-detail',
    templateUrl: 'notice-detail.page.html',
    imports: [CommonModule, DetailLayoutComponent]
})
export default class NoticeDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    id = input<string>();

    notice: NoticeDto | null = null;

    breadcrumbs: Breadcrumb[] = [
        { label: '공지사항 관리', link: '/notice' },
        { label: '상세 보기' },
    ];

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