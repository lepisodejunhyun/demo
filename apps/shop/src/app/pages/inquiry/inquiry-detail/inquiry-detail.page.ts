import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Api, inquiryControllerFindById, InquiryDto } from '@api-client-shop';
import { ToastrService } from 'ngx-toastr';
import { ContentWrapperComponent } from '../../../components/content-wrapper/content-wrapper.component';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';
import { ArticleViewComponent } from '../../../components/article-view/article-view.component';
import { LoadingSpinnerComponent } from '../../../components/loading-spinner/loading-spinner.component';
import { INQUIRY_STATUS_LABELS, getInquiryStatusStyle } from '../../../shared/constants/inquiry.constants';

@Component({
    selector: 'app-inquiry-detail',
    imports: [CommonModule, RouterLink, ContentWrapperComponent, BackButtonComponent, ArticleViewComponent, LoadingSpinnerComponent],
    templateUrl: './inquiry-detail.page.html',
})
export default class InquiryDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly toast = inject(ToastrService);

    id = input<string>();
    inquiry = signal<InquiryDto | null>(null);

    readonly statusLabels = INQUIRY_STATUS_LABELS;
    readonly getStatusStyle = getInquiryStatusStyle;

    async ngOnInit(): Promise<void> {
        const id = this.id();
        if (!id) return;

        try {
            this.inquiry.set(await this.api.invoke(inquiryControllerFindById, { id }));
        } catch (error) {
            console.error('문의 조회 실패', error);
            this.toast.error('데이터를 불러오지 못했습니다.');
            this.router.navigate(['/support/inquiry']);
        }
    }

    goBack(): void {
        this.router.navigate(['/support/inquiry']);
    }
}
