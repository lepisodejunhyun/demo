import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { Api, termsControllerFindById, termsControllerRemove, TermsDto } from "@api-client";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { DetailViewComponent } from "../../../components/detail-view/detail-view.component";

@Component({
    selector: 'app-terms-detail',
    templateUrl: 'terms-detail.page.html',
    imports: [CommonModule, RouterLink, PageHeaderComponent, BreadcrumbComponent, DetailViewComponent]
})
export default class TermsDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    id = input<string>();

    terms: TermsDto | null = null;

    breadcrumbs: Breadcrumb[] = [
        { label: '약관 관리', link: '/terms' },
        { label: '상세 보기' },
    ];

    async ngOnInit() {
        const id = this.id();

        if (!id) return;

        try {
            this.terms = await this.api.invoke(termsControllerFindById, {
                id: id,
            });
            this.cdr.markForCheck();
        } catch (error) {
            console.error('약관 조회 실패', error);

            this.router.navigate(['/terms']);
        }
    }

    async onDelete() {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await this.api.invoke(termsControllerRemove, {
                id: this.terms!.id
            });
            this.router.navigate(['/terms']);
        } catch (error) {
            console.error('약관 삭제 실패', error);
        }
    }
}
