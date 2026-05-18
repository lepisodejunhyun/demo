import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Output } from '@angular/core';
import { PageInfoDto } from '@api-client-shop';

@Component({
  selector: 'app-pagination',
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  pageInfo = input<PageInfoDto | null>(null);
  @Output() pageChange = new EventEmitter<number>();

  onPrev(): void {
    const info = this.pageInfo();
    if (info && info.page > 1) {
      this.pageChange.emit(info.page - 1);
    }
  }

  onNext(): void {
    const info = this.pageInfo();
    if (info && info.page < info.totalPages) {
      this.pageChange.emit(info.page + 1);
    }
  }
}
