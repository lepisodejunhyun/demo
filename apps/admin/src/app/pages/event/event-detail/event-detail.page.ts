import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { DetailViewComponent } from "../../../components/detail-view/detail-view.component";
import { Api, eventControllerFindById, eventControllerRemove, EventDto } from "@api-client";

@Component({
    selector: 'app-event-detail',
    templateUrl: './event-detail.page.html',
    imports: [CommonModule, RouterLink, PageHeaderComponent, BreadcrumbComponent, DetailViewComponent]
})
export default class EventDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    id = input<string>();

    event: EventDto | null = null;

    breadcrumbs: Breadcrumb[] = [
        { label: '행사 관리', link: '/event' },
        { label: '상세 보기' },
    ];

    async ngOnInit(): Promise<void> {
        const id = this.id();

        if (!id) return;

        try {
            this.event = await this.api.invoke(eventControllerFindById, {
                id,
            });
            this.cdr.markForCheck();
        } catch (error) {
            console.error('행사 정보 조회 실패', error);

            this.router.navigate(['/event']);
        }

    }

    async onDelete(): Promise<void> {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await this.api.invoke(eventControllerRemove, {
                id: this.event!.id,
            });
            this.router.navigate(['/event']);
        } catch (error) {
            console.error('행사 삭제 실패', error);
        }
    }


}