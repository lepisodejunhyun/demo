import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Api, inquiryControllerFindAll, InquiryDto, PageInfoDto } from "@api-client-shop";
import { PaginationComponent } from '../../components/pagination/pagination.component';

@Component({
    selector: 'app-inquiry',
    imports: [CommonModule, RouterLink, PaginationComponent],
    templateUrl: './inquiry.page.html',
})
export default class InquiryPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly route = inject(ActivatedRoute);

    inquiries: InquiryDto[] = [];
    pageInfo: PageInfoDto | null = null;

    readonly statusLabels: Record<string, string> = {
        'PENDING': '답변 대기',
        'COMPLETED': '답변 완료',
    };

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            const page = Number(params['page']) || 1;
            this.loadData(page);
        });
    }

    async loadData(page: number): Promise<void> {
        try {
            const result = await this.api.invoke(inquiryControllerFindAll, {
                page: page,
                limit: 10,
            });
            this.inquiries = result.items ?? [];
            this.pageInfo = result.pageInfo ?? null;
            this.cdr.markForCheck();
        } catch (error) {
            console.error('문의 목록 조회 실패', error);
        }
    }

    onPageChange(page: number): void {
        this.router.navigate([], {
            queryParams: { page },
        });
    }

    getStatusStyle(status: string): string {
        return status === 'COMPLETED'
            ? 'bg-primary/10 text-primary'
            : 'bg-secondary/10 text-secondary';
    }
}
