import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Api, galleryControllerFindById, GalleryDto } from '@api-client-shop';

@Component({
  selector: 'app-gallery-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery-detail.page.html',
})
export default class GalleryDetailPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  id = input<string>();

  gallery: GalleryDto | null = null;

  async ngOnInit() {
    const id = this.id();

    if (!id) return;

    try {
      this.gallery = await this.api.invoke(galleryControllerFindById, {
        id: id,
      });
      this.cdr.markForCheck();
    } catch (error) {
      console.error('갤러리 조회 실패', error);
      this.router.navigate(['/gallery']);
    }
  }

  goBack(): void {
    this.router.navigate(['/gallery']);
  }
}
