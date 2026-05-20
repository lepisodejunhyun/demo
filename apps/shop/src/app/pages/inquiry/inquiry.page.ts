import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Api, inquiryControllerFindAll, InquiryDto, PageInfoDto } from "@api-client-shop";
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ContentWrapperComponent } from '../../components/content-wrapper/content-wrapper.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { ToastrService } from 'ngx-toastr';
import { INQUIRY_STATUS_LABELS, getInquiryStatusStyle } from '../../shared/constants/inquiry.constants';

@Component({
    selector: 'app-inquiry',
    imports: [CommonModule, RouterLink, PaginationComponent, ContentWrapperComponent, EmptyStateComponent],
    templateUrl: './inquiry.page.html',
})
export default class InquiryPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly toast = inject(ToastrService);

    inquiries = signal<InquiryDto[]>([]);
    pageInfo = signal<PageInfoDto | null>(null);

    readonly statusLabels = INQUIRY_STATUS_LABELS;
    readonly getStatusStyle = getInquiryStatusStyle;

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
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
            this.inquiries.set(result.items ?? []);
            this.pageInfo.set(result.pageInfo ?? null);
        } catch (error) {
            console.error('문의 목록 조회 실패', error);
            this.toast.error('데이터를 불러오지 못했습니다.');
        }
    }

    onPageChange(page: number): void {
        this.router.navigate([], {
            queryParams: { page },
        });
    }
}
