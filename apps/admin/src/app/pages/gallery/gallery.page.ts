import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { CardGridComponent } from "../../components/card-grid/card-grid.component";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Api, galleryControllerFindAll, GalleryDto } from "@api-client";
import { PageInfo } from "../../components/data-table/data-table.types";
import { CardGridConfig } from "../../components/card-grid/card-grid.types";

@Component({
    selector: 'app-gallery',
    templateUrl: './gallery.page.html',
    imports: [CommonModule, PageHeaderComponent, CardGridComponent, RouterLink]
})
export default class GalleryPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly route = inject(ActivatedRoute);

    galleries: GalleryDto[] = [];
    pageInfo: PageInfo | null = null;

    config: CardGridConfig = {
        imageField: 'thumbnailUrl',
        titleField: 'title',
        dateField: 'createdAt',
    };

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
                limit: 8,
            });
            this.galleries = result.items ?? [];
            this.pageInfo = result.pageInfo ?? null;
            this.cdr.markForCheck();
        } catch (error) {
            console.error('갤러리 목록 조회 실패', error);
        }
    }

    onPageChange(page: number): void {
        this.router.navigate([], {
            queryParams: {
                page
            },
        });
    }

    goDetail(gallery: GalleryDto): void {
        this.router.navigate(['/gallery', gallery.id]);
    }
}