import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Api, noticeControllerFindAll, NoticeDto } from "@api-client";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { DataTableComponent } from "../../components/data-table/data-table.component";
import { ColumnDef, PageInfo } from "../../components/data-table/data-table.types";
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-notice',
    templateUrl: './notice.page.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, PageHeaderComponent, DataTableComponent, RouterLink],
})
export default class NoticePage implements OnInit {

    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly toast = inject(ToastrService);

    notices = signal<NoticeDto[]>([]);
    pageInfo = signal<PageInfo | null>(null);

    columns: ColumnDef[] = [
        { field: 'title', name: '제목', truncate: true },
        { field: 'content', name: '내용', truncate: true },
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
            const result = await this.api.invoke(noticeControllerFindAll, {
                page,
                limit: 10,
            });
            this.notices.set(result.items ?? []);
            this.pageInfo.set(result.pageInfo ?? null);
        } catch (error) {
            console.error('공지사항 목록 조회 실패', error);
            this.toast.error('데이터를 불러오지 못했습니다.');
        }
    }

    onPageChange(page: number): void {
        this.router.navigate([], {
            queryParams: {
                page
            },
        });
    }

    goDetail(notice: NoticeDto): void {
        this.router.navigate(['/notice', notice.id]);
    }

}