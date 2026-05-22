import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, effect, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { ButtonComponent } from "../../components/button/button.component";
import { Api, preRegistrationControllerFindAll, PreRegistrationDto } from "@api-client";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { DataTableComponent } from "../../components/data-table/data-table.component";
import { ColumnDef, PageInfo } from "../../components/data-table/data-table.types";
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-pre-registration',
    templateUrl: './pre-registration.page.html',
    imports: [CommonModule, PageHeaderComponent, DataTableComponent, ButtonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PreRegistrationPage {

    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly toast = inject(ToastrService);
    private readonly queryParams = toSignal(this.route.queryParams);

    preRegistrations = signal<PreRegistrationDto[]>([]);
    pageInfo = signal<PageInfo | null>(null);

    columns: ColumnDef[] = [
        { field: 'eventTitle', name: '행사명', truncate: true },
        { field: 'applicantName', name: '신청자명', width: 'w-32' },
        { field: 'contactNumber', name: '연락처', width: 'w-40' },
        { field: 'createdAt', name: '신청일', type: 'date', width: 'w-44' },
    ];

    constructor() {
        effect(() => {
            const page = Number(this.queryParams()?.['page']) || 1;
            this.loadData(page);
        });
    }

    async loadData(page: number): Promise<void> {
        try {
            const result = await this.api.invoke(preRegistrationControllerFindAll, {
                page,
                limit: 10 });
            this.preRegistrations.set(result.items ?? []);
            this.pageInfo.set(result.pageInfo ?? null);
        } catch (error) {
            console.error('사전 등록 목록 조회 실패', error);
            this.toast.error('데이터를 불러오지 못했습니다.');
        }
    }

    onPageChange(page: number): void {
        this.router.navigate([], {
            queryParams: {
                page
            } });
    }

    goDetail(item: PreRegistrationDto): void {
        this.router.navigate(['/pre-registration', item.id]);
    }

}