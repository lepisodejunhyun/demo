import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, effect, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { Api, inquiryControllerFindAll, InquiryDto } from "@api-client";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { DataTableComponent } from "../../components/data-table/data-table.component";
import { ColumnDef, PageInfo } from "../../components/data-table/data-table.types";
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-inquiry',
    templateUrl: './inquiry.page.html',
    imports: [CommonModule, PageHeaderComponent, DataTableComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InquiryPage {

    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly toast = inject(ToastrService);
    private readonly queryParams = toSignal(this.route.queryParams);

    inquiries = signal<InquiryDto[]>([]);
    pageInfo = signal<PageInfo | null>(null);

    columns: ColumnDef[] = [
        { field: 'title', name: '제목', truncate: true },
        { field: 'authorName', name: '작성자', width: 'w-28' },
        {
            field: 'status', name: '상태', type: 'badge', width: 'w-28',
            badgeMap: {
                'COMPLETED': { label: '답변 완료', variant: 'primary' },
                'PENDING': { label: '답변 대기', variant: 'outline' },
            },
        },
        { field: 'createdAt', name: '등록일', type: 'date', width: 'w-44' },
    ];

    constructor() {
        effect(() => {
            const page = Number(this.queryParams()?.['page']) || 1;
            this.loadData(page);
        });
    }

    async loadData(page: number): Promise<void> {
        try {
            const result = await this.api.invoke(inquiryControllerFindAll, {
                page,
                limit: 10,
            });
            this.inquiries.set(result.items ?? []);
            this.pageInfo.set(result.pageInfo ?? null);
        } catch (error) {
            console.error('1:1 문의 목록 조회 실패', error);
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

    goDetail(inquiry: InquiryDto): void {
        this.router.navigate(['/inquiry', inquiry.id]);
    }

}