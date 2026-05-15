import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Api, inquiryControllerFindById, InquiryDto } from '@api-client-shop';

@Component({
    selector: 'app-inquiry-detail',
    imports: [CommonModule],
    templateUrl: './inquiry-detail.page.html',
})
export default class InquiryDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    id = input<string>();

    inquiry: InquiryDto | null = null;

    readonly statusLabels: Record<string, string> = {
        'PENDING': '답변 대기',
        'COMPLETED': '답변 완료',
    };

    async ngOnInit() {
        const id = this.id();
        if (!id) return;

        try {
            this.inquiry = await this.api.invoke(inquiryControllerFindById, { id });
            this.cdr.markForCheck();
        } catch (error) {
            console.error('문의 조회 실패', error);
            this.router.navigate(['/inquiry']);
        }
    }

    goBack(): void {
        this.router.navigate(['/inquiry']);
    }

    getStatusStyle(status: string): string {
        return status === 'COMPLETED'
            ? 'bg-primary/10 text-primary'
            : 'bg-secondary/10 text-secondary';
    }
}
