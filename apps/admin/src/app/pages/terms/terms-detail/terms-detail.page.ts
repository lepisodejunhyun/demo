import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Api, termsControllerFindById, termsControllerRemove, TermsDto } from "@api-client";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { DetailViewComponent } from "../../../components/detail-view/detail-view.component";
import { ButtonComponent } from "../../../components/button/button.component";
import { StatusBadgeComponent } from "../../../components/status-badge/status-badge.component";
import { ToastrService } from 'ngx-toastr';
import { DialogService } from "../../../components/confirm-dialog/confirm-dialog.service";

@Component({
    selector: 'app-terms-detail',
    templateUrl: 'terms-detail.page.html',
    imports: [CommonModule, PageHeaderComponent, BreadcrumbComponent, DetailViewComponent, ButtonComponent, StatusBadgeComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TermsDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly toast = inject(ToastrService);
    private readonly dialog = inject(DialogService)

    id = input<string>();

    terms = signal<TermsDto | null>(null);

    breadcrumbs: Breadcrumb[] = [
        { label: '약관 관리', link: '/terms' },
        { label: '상세 보기' },
    ];

    async ngOnInit(): Promise<void> {
        const id = this.id();

        if (!id) return;

        try {
            this.terms.set(await this.api.invoke(termsControllerFindById, {
                id,
            }));
        } catch (error) {
            console.error('약관 조회 실패', error);
            this.toast.error('데이터를 불러오지 못했습니다.');

            this.router.navigate(['/terms']);
        }
    }

    async onDelete(): Promise<void> {
        if (!await this.dialog.confirm({ title: '약관 삭제', message: '삭제하시겠습니까?' })) return;

        try {
            await this.api.invoke(termsControllerRemove, {
                id: this.terms()!.id
            });
            this.toast.success('삭제되었습니다.');
            this.router.navigate(['/terms']);
        } catch (error) {
            console.error('약관 삭제 실패', error);
            this.toast.error('삭제에 실패했습니다.');
        }
    }
}
