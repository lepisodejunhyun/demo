import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Api, eventControllerFindById, EventDto } from '@api-client-shop';
import { ToastrService } from 'ngx-toastr';
import { ContentWrapperComponent } from '../../../components/content-wrapper/content-wrapper.component';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';
import { ArticleViewComponent } from '../../../components/article-view/article-view.component';
import { LoadingSpinnerComponent } from '../../../components/loading-spinner/loading-spinner.component';
import { getEventStatus, isPreRegistrationOpen } from '../../../shared/utils/event-status.util';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ContentWrapperComponent, BackButtonComponent, ArticleViewComponent, LoadingSpinnerComponent],
  templateUrl: './event-detail.page.html',
})
export default class EventDetailPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastrService);

  id = input<string>();

  event = signal<EventDto | null>(null);

  readonly getEventStatus = getEventStatus;
  readonly isPreRegistrationOpen = isPreRegistrationOpen;

  async ngOnInit(): Promise<void> {
    const id = this.id();

    if (!id) return;

    try {
      this.event.set(await this.api.invoke(eventControllerFindById, { id }));
    } catch (error) {
      console.error('행사 조회 실패', error);
      this.toast.error('데이터를 불러오지 못했습니다.');
      this.router.navigate(['/event']);
    }
  }

  goBack(): void {
    this.router.navigate(['/event']);
  }
}
