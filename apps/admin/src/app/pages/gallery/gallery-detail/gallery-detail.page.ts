import { CommonModule } from "@angular/common";
import { Component, inject, input, OnInit, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { DetailViewComponent } from "../../../components/detail-view/detail-view.component";
import { ToastrService } from 'ngx-toastr';
import { Api, galleryControllerFindById, galleryControllerRemove, GalleryDto } from "@api-client";

@Component({
    selector: 'app-gallery-detail',
    templateUrl: './gallery-detail.page.html',
    imports: [CommonModule, RouterLink, PageHeaderComponent, BreadcrumbComponent, DetailViewComponent]
})
export default class GalleryDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly toast = inject(ToastrService);

    id = input<string>();

    gallery = signal<GalleryDto | null>(null);

    breadcrumbs: Breadcrumb[] = [
        { label: '갤러리 관리', link: '/gallery' },
        { label: '상세 보기' },
    ];

    async ngOnInit(): Promise<void> {
        const id = this.id();

        if (!id) return;

        try {
            this.gallery.set(await this.api.invoke(galleryControllerFindById, { id }));
        } catch (error) {
            console.error('갤러리 조회 실패', error);
            this.toast.error('데이터를 불러오지 못했습니다.');

            this.router.navigate(['/gallery']);
        }

    }

    async onDelete(): Promise<void> {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await this.api.invoke(galleryControllerRemove, {
                id: this.gallery()!.id,
            });
            this.toast.success('삭제되었습니다.');
            this.router.navigate(['/gallery']);
        } catch (error) {
            console.error('갤러리 삭제 실패', error);
            this.toast.error('삭제에 실패했습니다.');
        }
    }

    selectedImage: string | null = null;

    openImage(url: string): void {
        this.selectedImage = url;
    }

    closeImage(): void {
        this.selectedImage = null;
    }

}
