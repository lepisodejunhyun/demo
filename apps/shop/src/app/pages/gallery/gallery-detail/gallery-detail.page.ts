import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Api, galleryControllerFindById, GalleryDto } from '@api-client-shop';
import { ToastrService } from 'ngx-toastr';
import { ContentWrapperComponent } from '../../../components/content-wrapper/content-wrapper.component';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';
import { ArticleViewComponent } from '../../../components/article-view/article-view.component';
import { LoadingSpinnerComponent } from '../../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-gallery-detail',
  standalone: true,
  imports: [CommonModule, ContentWrapperComponent, BackButtonComponent, ArticleViewComponent, LoadingSpinnerComponent],
  templateUrl: './gallery-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GalleryDetailPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastrService);

  id = input<string>();
  gallery = signal<GalleryDto | null>(null);

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

  goBack(): void {
    this.router.navigate(['/gallery']);
  }
}
