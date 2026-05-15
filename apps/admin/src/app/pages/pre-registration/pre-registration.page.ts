import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Api, preRegistrationControllerFindAll, PreRegistrationDto } from "@api-client";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { DataTableComponent } from "../../components/data-table/data-table.component";
import { ColumnDef, PageInfo } from "../../components/data-table/data-table.types";

@Component({
    selector: 'app-pre-registration',
    templateUrl: './pre-registration.page.html',
    imports: [CommonModule, PageHeaderComponent, DataTableComponent, RouterLink],
})
export default class PreRegistrationPage implements OnInit {

    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly route = inject(ActivatedRoute);

    preRegistrations: PreRegistrationDto[] = [];
    pageInfo: PageInfo | null = null;

    columns: ColumnDef[] = [
        { field: 'eventTitle', name: '행사명', truncate: true },
        { field: 'applicantName', name: '신청자명', width: 'w-32' },
        { field: 'contactNumber', name: '연락처', width: 'w-40' },
        { field: 'createdAt', name: '신청일시', type: 'date', width: 'w-44' },
    ];

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            const page = Number(params['page']) || 1;
            this.loadData(page);
        });
    }

    async loadData(page: number): Promise<void> {
        try {
            const result = await this.api.invoke(preRegistrationControllerFindAll, {
                page: page,
                limit: 10,
            });
            this.preRegistrations = result.items ?? [];
            this.pageInfo = result.pageInfo ?? null;
            this.cdr.markForCheck();
        } catch (error) {
            console.error('사전 등록 목록 조회 실패', error);
        }
    }

    onPageChange(page: number): void {
        this.router.navigate([], {
            queryParams: {
                page
            },
        });
    }

    goDetail(item: PreRegistrationDto): void {
        this.router.navigate(['/pre-registration', item.id]);
    }

}