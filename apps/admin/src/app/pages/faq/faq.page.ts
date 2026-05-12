import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { Api, faqControllerFindAll, FaqDto } from "@api-client";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { DataTableComponent } from "../../components/data-table/data-table.component";
import { ColumnDef, PageInfo } from "../../components/data-table/data-table.types";

@Component({
    selector: 'app-faq',
    templateUrl: './faq.page.html',
    imports: [CommonModule, PageHeaderComponent, DataTableComponent],
})
export default class FaqPage implements OnInit {

    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    faqs: FaqDto[] = [];
    pageInfo: PageInfo | null = null;

    columns: ColumnDef[] = [
        { field: 'question', name: '질문', truncate: true },
        { field: 'answer', name: '답변', truncate: true },
        { field: 'createdAt', name: '등록일', type: 'date', width: 'w-44' },
    ];

    async ngOnInit(): Promise<void> {
        await this.loadData(1);
    }

    async loadData(page: number): Promise<void> {
        try {
            const result = await this.api.invoke(faqControllerFindAll, {
                page: page,
                limit: 10,
            });
            this.faqs = result.items ?? [];
            this.pageInfo = result.pageInfo ?? null;
            this.cdr.markForCheck();
        } catch (error) {
            console.error('FAQ 목록 조회 실패', error);
        }
    }

    goDetail(faq: FaqDto): void {
        this.router.navigate(['/faq', faq.id]);
    }
}