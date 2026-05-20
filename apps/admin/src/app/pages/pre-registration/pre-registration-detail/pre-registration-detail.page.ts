import { CommonModule } from "@angular/common";
import { Component, inject, input, OnInit, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { Api, preRegistrationControllerFindById, preRegistrationControllerRemove, PreRegistrationDto } from "@api-client";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { DetailViewComponent } from "../../../components/detail-view/detail-view.component";
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-pre-registration-detail',
    templateUrl: 'pre-registration-detail.page.html',
    imports: [CommonModule, RouterLink, PageHeaderComponent, BreadcrumbComponent, DetailViewComponent]
})
export default class PreRegistrationDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly toast = inject(ToastrService);

    id = input<string>();

    preRegistration = signal<PreRegistrationDto | null>(null);

    breadcrumbs: Breadcrumb[] = [
        { label: '사전 등록 관리', link: '/pre-registration' },
        { label: '상세 보기' },
    ];

    async ngOnInit(): Promise<void> {
        const id = this.id();

        if (!id) return;

        try {
            this.preRegistration.set(await this.api.invoke(preRegistrationControllerFindById, { id }));
        } catch (error) {
            console.error('사전 등록 조회 실패', error);
            this.toast.error('데이터를 불러오지 못했습니다.');

            this.router.navigate(['/pre-registration']);
        }
    }

    async onDelete(): Promise<void> {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await this.api.invoke(preRegistrationControllerRemove, {
                id: this.preRegistration()!.id
            });
            this.toast.success('삭제되었습니다.');
            this.router.navigate(['/pre-registration']);
        } catch (error) {
            console.error('사전 등록 삭제 실패', error);
            this.toast.error('삭제에 실패했습니다.');
        }
    }
}
