import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Api, inquiryControllerFindAll, InquiryDto } from "@api-client";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { DataTableComponent } from "../../components/data-table/data-table.component";
import { ColumnDef, PageInfo } from "../../components/data-table/data-table.types";

@Component({
    selector: 'app-inquiry',
    templateUrl: './inquiry.page.html',
    imports: [CommonModule, PageHeaderComponent, DataTableComponent],
})
export default class InquiryPage implements OnInit {

    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    inquiries = signal<(InquiryDto & { statusLabel: string })[]>([]);
    pageInfo = signal<PageInfo | null>(null);

    readonly statusLabels: Record<string, string> = {
        'PENDING': '답변 대기',
        'COMPLETED': '답변 완료',
    };

    columns: ColumnDef[] = [
        { field: 'title', name: '제목', truncate: true },
        { field: 'authorName', name: '작성자', width: 'w-28' },
        { field: 'statusLabel', name: '상태', width: 'w-28' },
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
            const result = await this.api.invoke(inquiryControllerFindAll, {
                page,
                limit: 10,
            });
            this.inquiries.set((result.items ?? []).map((item: InquiryDto) => ({
                ...item,
                statusLabel: this.statusLabels[item.status] ?? item.status,
            })));
            this.pageInfo.set(result.pageInfo ?? null);
        } catch (error) {
            console.error('1:1 문의 목록 조회 실패', error);
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