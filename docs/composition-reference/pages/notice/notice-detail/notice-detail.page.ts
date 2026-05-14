import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Api, noticeControllerFindById, noticeControllerRemove, NoticeDto } from "@api-client";

// 조합 방식: 필요한 컴포넌트를 개별로 import
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { PageTitleComponent } from "../../../components/page-title/page-title.component";
import { DetailActionsComponent } from "../../../components/detail-actions/detail-actions.component";
import { BackLinkComponent } from "../../../components/back-link/back-link.component";

@Component({
    selector: 'app-notice-detail',
    templateUrl: 'notice-detail.page.html',
    // 래핑 방식: imports: [CommonModule, DetailLayoutComponent]
    // 조합 방식: 사용하는 컴포넌트를 각각 import
    imports: [CommonModule, BreadcrumbComponent, PageTitleComponent, DetailActionsComponent, BackLinkComponent]
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
