import { CommonModule } from "@angular/common";
import { Component, inject, input, OnInit, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { Api, noticeControllerFindById, noticeControllerRemove, NoticeDto } from "@api-client";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { DetailViewComponent } from "../../../components/detail-view/detail-view.component";

@Component({
    selector: 'app-notice-detail',
    templateUrl: 'notice-detail.page.html',
    imports: [CommonModule, RouterLink, PageHeaderComponent, BreadcrumbComponent, DetailViewComponent]
})
export default class NoticeDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);

    id = input<string>();

    notice = signal<NoticeDto | null>(null);

    breadcrumbs: Breadcrumb[] = [
        { label: '공지사항 관리', link: '/notice' },
        { label: '상세 보기' },
    ];

    async ngOnInit(): Promise<void> {
        const id = this.id();

        if (!id) return;

        try {
            this.notice.set(await this.api.invoke(noticeControllerFindById, {
                id,
            }));
        } catch (error) {
            console.error('공지사항 조회 실패', error);

            this.router.navigate(['/notice']);
        }
    }

    async onDelete(): Promise<void> {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await this.api.invoke(noticeControllerRemove, {
                id: this.notice()!.id
            });
            this.router.navigate(['/notice']);
        } catch (error) {
            console.error('공지사항 삭제 실패', error);
        }
    }
}
