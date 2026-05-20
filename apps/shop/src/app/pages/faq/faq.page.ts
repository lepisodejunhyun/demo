import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Api, faqControllerFindAll, FaqDto, PageInfoDto } from "@api-client-shop";
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ContentWrapperComponent } from '../../components/content-wrapper/content-wrapper.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-faq',
    imports: [CommonModule, PaginationComponent, ContentWrapperComponent, EmptyStateComponent],
    templateUrl: './faq.page.html',
})
export default class FaqPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly toast = inject(ToastrService);

    faqs = signal<FaqDto[]>([]);
    pageInfo = signal<PageInfoDto | null>(null);
    expandedId = signal<string | null>(null);

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
            this.faqs.set(result.items || []);
            this.pageInfo.set(result.pageInfo ?? null);
        } catch (error) {
            console.error('FAQ 목록 조회 실패', error);
            this.toast.error('데이터를 불러오지 못했습니다.');
        }
    }

    onPageChange(page: number): void {
        this.router.navigate([], {
            queryParams: { page },
        });
    }

    toggle(id: string): void {
        this.expandedId.set(this.expandedId() === id ? null : id);
    }
}