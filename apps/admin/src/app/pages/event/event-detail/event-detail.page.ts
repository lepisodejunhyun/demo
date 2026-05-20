import { CommonModule } from "@angular/common";
import { Component, inject, input, OnInit, signal } from "@angular/core";
import { Router } from "@angular/router";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { DetailViewComponent } from "../../../components/detail-view/detail-view.component";
import { ButtonComponent } from "../../../components/button/button.component";
import { DetailFieldComponent } from "../../../components/detail-field/detail-field.component";
import { Api, eventControllerFindById, eventControllerRemove, EventDto } from "@api-client";
import { ToastrService } from 'ngx-toastr';
import { DialogService } from "../../../components/confirm-dialog/confirm-dialog.service";

@Component({
    selector: 'app-event-detail',
    templateUrl: './event-detail.page.html',
    imports: [CommonModule, PageHeaderComponent, BreadcrumbComponent, DetailViewComponent, ButtonComponent, DetailFieldComponent]
})
export default class EventDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly toast = inject(ToastrService);
    private readonly dialog = inject(DialogService);

    id = input<string>();

    event = signal<EventDto | null>(null);

    breadcrumbs: Breadcrumb[] = [
        { label: '행사 관리', link: '/event' },
        { label: '상세 보기' },
    ];

    async ngOnInit(): Promise<void> {
        const id = this.id();

        if (!id) return;

        try {
            this.event.set(await this.api.invoke(eventControllerFindById, { id }));
        } catch (error) {
            console.error('행사 정보 조회 실패', error);
            this.toast.error('데이터를 불러오지 못했습니다.');

            this.router.navigate(['/event']);
        }

    }

    async onDelete(): Promise<void> {
        if (!await this.dialog.confirm({ title: '행사 정보 삭제', message: '정말 삭제하시겠습니까?'})) return;

        try {
            await this.api.invoke(eventControllerRemove, {
                id: this.event()!.id,
            });
            this.toast.success('삭제되었습니다.');
            this.router.navigate(['/event']);
        } catch (error) {
            console.error('행사 삭제 실패', error);
            this.toast.error('삭제에 실패했습니다.');
        }
    }


}
