import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Api, galleryControllerFindAll, GalleryDto, PageInfoDto } from '@api-client-shop';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { CardGridComponent } from '../../components/card-grid/card-grid.component';
import { ImageCardComponent } from '../../components/image-card/image-card.component';
import { ContentWrapperComponent } from '../../components/content-wrapper/content-wrapper.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, PaginationComponent, CardGridComponent, ImageCardComponent, ContentWrapperComponent],
  templateUrl: './gallery.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GalleryPage {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastrService);
  private readonly queryParams = toSignal(this.route.queryParams);

  galleries = signal<GalleryDto[]>([]);
  pageInfo = signal<PageInfoDto | null>(null);

  constructor() {
    effect(() => {
      const page = Number(this.queryParams()?.['page']) || 1;
      this.loadData(page);
    });
  }

  async loadData(page: number): Promise<void> {
    try {
      const result = await this.api.invoke(galleryControllerFindAll, {
        page,
        limit: 8,
      });
      this.galleries.set(result.items ?? []);
      this.pageInfo.set(result.pageInfo ?? null);
    } catch (error) {
      console.error('갤러리 목록 조회 실패', error);
      this.toast.error('데이터를 불러오지 못했습니다.');
    }
  }

  onPageChange(page: number): void {
    this.router.navigate([], { queryParams: { page } });
  }

  goDetail(gallery: GalleryDto): void {
    this.router.navigate(['/gallery', gallery.id]);
  }
}
