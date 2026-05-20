import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { Api, eventControllerFindAll, EventDto } from "@api-client";
import { ActivatedRoute, Router } from "@angular/router";
import { ButtonComponent } from "../../components/button/button.component";
import { ColumnDef, PageInfo } from "../../components/data-table/data-table.types";
import { DataTableComponent } from "../../components/data-table/data-table.component";
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-event',
    templateUrl: './event.page.html',
    imports: [CommonModule, PageHeaderComponent, DataTableComponent, ButtonComponent]
})
export default class EventPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly toast = inject(ToastrService);

    events = signal<EventDto[]>([]);
    pageInfo = signal<PageInfo | null>(null);

    columns: ColumnDef[] = [
        { field: 'title', name: '행사명', truncate: true },
        // { field: 'location', name: '행사 장소', truncate: true },
        { field: 'startDate', name: '행사 시작일', type: 'date', truncate: true },
        { field: 'endDate', name: '행사 종료일', type: 'date', truncate: true },
        { field: 'createdAt', name: '등록일', type: 'date', width: 'w-44' },
    ];

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            const page = Number(params['page']) || 1;
            this.loadData(page);
        });
    }

    async loadData(page: number): Promise<void> {
        try {
            const result = await this.api.invoke(eventControllerFindAll, {
                page,
                limit: 10 });
            this.events.set(result.items ?? []);
            this.pageInfo.set(result.pageInfo ?? null);
        } catch (error) {
            console.error('행사 목록 조회 실패', error);
            this.toast.error('데이터를 불러오지 못했습니다.');
        }
    }

    onPageChange(page: number): void {
        this.router.navigate([], {
            queryParams: {
                page
            } });
    }

    goDetail(event: EventDto): void {
        this.router.navigate(['/event', event.id]);
    }

}