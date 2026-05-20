import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { CardGridComponent } from "../../components/card-grid/card-grid.component";
import { ActivatedRoute, Router } from "@angular/router";
import { ButtonComponent } from "../../components/button/button.component";
import { Api, galleryControllerFindAll, GalleryDto } from "@api-client";
import { PageInfo } from "../../components/data-table/data-table.types";
import { CardGridConfig } from "../../components/card-grid/card-grid.types";
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-gallery',
    templateUrl: './gallery.page.html',
    imports: [CommonModule, PageHeaderComponent, CardGridComponent, ButtonComponent]
})
export default class GalleryPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly toast = inject(ToastrService);

    galleries = signal<GalleryDto[]>([]);
    pageInfo = signal<PageInfo | null>(null);

    config: CardGridConfig = {
        imageField: 'thumbnailUrl',
        titleField: 'title',
        dateField: 'createdAt' };

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            const page = Number(params['page']) || 1;
            this.loadData(page);
        });
    }

    async loadData(page: number): Promise<void> {
        try {
            const result = await this.api.invoke(galleryControllerFindAll, {
                page,
                limit: 8 });
            this.galleries.set(result.items ?? []);
            this.pageInfo.set(result.pageInfo ?? null);
        } catch (error) {
            console.error('갤러리 목록 조회 실패', error);
            this.toast.error('데이터를 불러오지 못했습니다.');
        }
    }

    onPageChange(page: number): void {
        this.router.navigate([], {
            queryParams: {
                page
            } });
    }

    goDetail(gallery: GalleryDto): void {
        this.router.navigate(['/gallery', gallery.id]);
    }
}