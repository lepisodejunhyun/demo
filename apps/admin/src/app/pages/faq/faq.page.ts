import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Api, faqControllerFindAll, FaqDto } from "@api-client";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { DataTableComponent } from "../../components/data-table/data-table.component";
import { ColumnDef, PageInfo } from "../../components/data-table/data-table.types";

@Component({
    selector: 'app-faq',
    templateUrl: './faq.page.html',
    imports: [CommonModule, PageHeaderComponent, DataTableComponent, RouterLink],
})
export default class FaqPage implements OnInit {

    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    faqs = signal<FaqDto[]>([]);
    pageInfo = signal<PageInfo | null>(null);

    columns: ColumnDef[] = [
        { field: 'question', name: '질문', truncate: true },
        { field: 'answer', name: '답변', truncate: true },
        { field: 'createdAt', name: '등록일', type: 'date', width: 'w-44' },
    ];

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            const page = Number(params['page']) || 1;
            this.loadData(page);
        })
    }

    async loadData(page: number): Promise<void> {
        try {
            const result = await this.api.invoke(faqControllerFindAll, {
                page,
                limit: 10,
            });
            this.faqs.set(result.items ?? []);
            this.pageInfo.set(result.pageInfo ?? null);
        } catch (error) {
            console.error('FAQ 목록 조회 실패', error);
        }
    }

    onPageChange(page: number): void {
        this.router.navigate([], {
            queryParams: {
                page
            },
        });
    }

    goDetail(faq: FaqDto): void {
        this.router.navigate(['/faq', faq.id]);
    }
}