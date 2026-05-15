import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { Api, preRegistrationControllerFindById, preRegistrationControllerRemove, PreRegistrationDto } from "@api-client";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { DetailViewComponent } from "../../../components/detail-view/detail-view.component";

@Component({
    selector: 'app-pre-registration-detail',
    templateUrl: 'pre-registration-detail.page.html',
    imports: [CommonModule, RouterLink, PageHeaderComponent, BreadcrumbComponent, DetailViewComponent]
})
export default class PreRegistrationDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    id = input<string>();

    item: PreRegistrationDto | null = null;

    breadcrumbs: Breadcrumb[] = [
        { label: '사전 등록 관리', link: '/pre-registration' },
        { label: '상세 보기' },
    ];

    async ngOnInit() {
        const id = this.id();

        if (!id) return;

        try {
            this.item = await this.api.invoke(preRegistrationControllerFindById, {
                id: id,
            });
            this.cdr.markForCheck();
        } catch (error) {
            console.error('사전 등록 조회 실패', error);

            this.router.navigate(['/pre-registration']);
        }
    }

    async onDelete() {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await this.api.invoke(preRegistrationControllerRemove, {
                id: this.item!.id
            });
            this.router.navigate(['/pre-registration']);
        } catch (error) {
            console.error('사전 등록 삭제 실패', error);
        }
    }
}
