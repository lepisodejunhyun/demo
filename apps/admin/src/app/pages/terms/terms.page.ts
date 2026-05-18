import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Api, termsControllerFindAll, TermsDto } from "@api-client";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { DataTableComponent } from "../../components/data-table/data-table.component";
import { ColumnDef, PageInfo } from "../../components/data-table/data-table.types";

@Component({
    selector: 'app-terms',
    templateUrl: './terms.page.html',
    imports: [CommonModule, PageHeaderComponent, DataTableComponent, RouterLink],
})
export default class TermsPage implements OnInit {

    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly route = inject(ActivatedRoute);

    terms: TermsDto[] = [];
    pageInfo: PageInfo | null = null;

    columns: ColumnDef[] = [
        { field: 'title', name: '제목', truncate: true },
        { field: 'content', name: '내용', truncate: true },
        { field: 'isRequired', name: '구분', type: 'boolean', booleanLabels: { true: '필수 약관', false: '선택 약관' }, width: 'w-30' },
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
            const result = await this.api.invoke(termsControllerFindAll, {
                page: page,
                limit: 10,
            });
            this.terms = result.items ?? [];
            this.pageInfo = result.pageInfo ?? null;
            this.cdr.markForCheck();
        } catch (error) {
            console.error('약관 목록 조회 실패', error);
        }
    }

    onPageChange(page: number): void {
        this.router.navigate([], {
            queryParams: {
                page
            },
        });
    }

    goDetail(item: TermsDto): void {
        this.router.navigate(['/terms', item.id]);
    }

}
