import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Api, faqControllerFindAll, FaqDto, PageInfoDto } from "@api-client-shop";
import { PaginationComponent } from '../../components/pagination/pagination.component';

@Component({
    selector: 'app-faq',
    imports: [CommonModule, PaginationComponent],
    templateUrl: './faq.page.html',
})
export default class FaqPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly route = inject(ActivatedRoute);

    faqs: FaqDto[] = [];
    pageInfo: PageInfoDto | null = null;
    expandedId: string | null = null;

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            const page = Number(params['page']) || 1;
            this.loadData(page);
        });
    }

    async loadData(page: number): Promise<void> {
        try {
            const result = await this.api.invoke(faqControllerFindAll, {
                page,
                limit: 10,
            });
            this.faqs = result.items || [];
            this.pageInfo = result.pageInfo ?? null;
            this.cdr.markForCheck();
        } catch (error) {
            console.error('FAQ 목록 조회 실패', error);
        }
    }

    onPageChange(page: number): void {
        this.router.navigate([], {
            queryParams: { page },
        });
    }

    toggle(id: string): void {
        this.expandedId = this.expandedId === id ? null : id;
    }
}