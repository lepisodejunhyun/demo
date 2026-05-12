import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Api, noticeControllerFindAll, NoticeDto } from "@api-client";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { DataTableComponent } from "../../components/data-table/data-table.component";
import { ColumnDef, PageInfo } from "../../components/data-table/data-table.types";

@Component({
    selector: 'app-notice',
    templateUrl: './notice.page.html',
    imports: [CommonModule, PageHeaderComponent, DataTableComponent],
})
export default class NoticePage implements OnInit {

    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    notices: NoticeDto[] = [];
    pageInfo: PageInfo | null = null;

    columns: ColumnDef[] = [
        { field: 'title', name: '제목', truncate: true },
        { field: 'content', name: '내용', truncate: true },
        { field: 'createdAt', name: '등록일', type: 'date', width: 'w-44' },
    ];

    async ngOnInit(): Promise<void> {
        await this.loadData(1);
    }

    async loadData(page: number): Promise<void> {
        try {
            const result = await this.api.invoke(noticeControllerFindAll, {
                page: page,
                limit: 10,
            });
            this.notices = result.items ?? [];
            this.pageInfo = result.pageInfo ?? null;
            this.cdr.markForCheck();
        } catch (error) {
            console.error('공지사항 목록 조회 실패', error);
        }
    }

    goDetail(notice: NoticeDto): void {
        this.router.navigate(['/notice', notice.id]);
    }

}