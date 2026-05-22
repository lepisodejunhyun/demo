import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, effect, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { ButtonComponent } from "../../components/button/button.component";
import { Api, termsControllerFindAll, TermsDto } from "@api-client";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { DataTableComponent } from "../../components/data-table/data-table.component";
import { ColumnDef, PageInfo } from "../../components/data-table/data-table.types";
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-terms',
    templateUrl: './terms.page.html',
    imports: [CommonModule, PageHeaderComponent, DataTableComponent, ButtonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TermsPage {

    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly toast = inject(ToastrService);
    private readonly queryParams = toSignal(this.route.queryParams);

    terms = signal<TermsDto[]>([]);
    pageInfo = signal<PageInfo | null>(null);

    columns: ColumnDef[] = [
        { field: 'title', name: '제목', truncate: true },
        { field: 'content', name: '내용', truncate: true },
        { field: 'isRequired', name: '구분', type: 'boolean', booleanLabels: { true: '필수 약관', false: '선택 약관' }, width: 'w-30' },
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
            const result = await this.api.invoke(termsControllerFindAll, {
                page,
                limit: 10 });
            this.terms.set(result.items ?? []);
            this.pageInfo.set(result.pageInfo ?? null);
        } catch (error) {
            console.error('약관 목록 조회 실패', error);
            this.toast.error('데이터를 불러오지 못했습니다.');
        }
    }

    onPageChange(page: number): void {
        this.router.navigate([], {
            queryParams: {
                page
            } });
    }

    goDetail(item: TermsDto): void {
        this.router.navigate(['/terms', item.id]);
    }

}
