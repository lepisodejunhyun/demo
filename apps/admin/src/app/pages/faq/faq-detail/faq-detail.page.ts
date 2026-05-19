import { CommonModule } from "@angular/common";
import { Component, inject, input, OnInit, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { Api, faqControllerFindById, faqControllerRemove, FaqDto } from "@api-client";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { DetailViewComponent } from "../../../components/detail-view/detail-view.component";

@Component({
    selector: 'app-faq-detail',
    templateUrl: './faq-detail.page.html',
    imports: [CommonModule, RouterLink, PageHeaderComponent, BreadcrumbComponent, DetailViewComponent]
})
export default class FaqDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);

    id = input<string>();

    faq = signal<FaqDto | null>(null);

    breadcrumbs: Breadcrumb[] = [
        { label: 'FAQ 관리', link: '/faq' },
        { label: '상세 보기' },
    ];

    async ngOnInit(): Promise<void> {
        const id = this.id();

        if (!id) return;

        try {
            this.faq.set(await this.api.invoke(faqControllerFindById, {
                id,
            }));
        } catch (error) {
            console.error('FAQ 조회 실패', error);

            this.router.navigate(['/faq']);
        }

    }

    async onDelete(): Promise<void> {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await this.api.invoke(faqControllerRemove, {
                id: this.faq()!.id,
            });
            this.router.navigate(['/faq']);
        } catch (error) {
            console.error('FAQ 삭제 실패', error);
        }
    }
}
