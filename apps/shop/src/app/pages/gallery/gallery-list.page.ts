import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api, galleryControllerFindAll, GalleryDto, PageInfoDto } from '@api-client-shop';

@Component({
  selector: 'app-gallery-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery-list.page.html',
})
export default class GalleryListPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);

  galleries: GalleryDto[] = [];
  pageInfo: PageInfoDto | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const page = Number(params['page']) || 1;
      this.loadData(page);
    });
  }

  async loadData(page: number): Promise<void> {
    try {
      const result = await this.api.invoke(galleryControllerFindAll, {
        page: page,
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
        page,
      },
    });
  }

  goDetail(gallery: GalleryDto): void {
    this.router.navigate(['/gallery', gallery.id]);
  }
}
