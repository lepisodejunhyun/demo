import { CommonModule } from "@angular/common";
import { Component, inject, input, OnInit, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Api, faqControllerFindById, faqControllerRemove, FaqDto } from "@api-client";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { DetailViewComponent } from "../../../components/detail-view/detail-view.component";
import { ButtonComponent } from "../../../components/button/button.component";
import { ToastrService } from 'ngx-toastr';
import { DialogService } from "../../../components/confirm-dialog/confirm-dialog.service";

@Component({
    selector: 'app-faq-detail',
    templateUrl: './faq-detail.page.html',
    imports: [CommonModule, PageHeaderComponent, BreadcrumbComponent, DetailViewComponent, ButtonComponent]
})
export default class FaqDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly toast = inject(ToastrService);
    private readonly dialog = inject(DialogService)

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
            this.toast.error('데이터를 불러오지 못했습니다.');

            this.router.navigate(['/faq']);
        }

    }

    async onDelete(): Promise<void> {
        if (!await this.dialog.confirm({ title: 'FAQ 삭제', message: '정말 삭제하시겠습니까?'})) return;

        try {
            await this.api.invoke(faqControllerRemove, {
                id: this.faq()!.id,
            });
            this.toast.success('삭제되었습니다.');
            this.router.navigate(['/faq']);
        } catch (error) {
            console.error('FAQ 삭제 실패', error);
            this.toast.error('삭제에 실패했습니다.');
        }
    }
}
