import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Api, galleryControllerFindAll, GalleryDto, PageInfoDto } from '@api-client-shop';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './gallery.page.html',
})
export default class GalleryPage implements OnInit {
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
