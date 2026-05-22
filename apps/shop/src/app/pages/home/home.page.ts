import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { Api, eventControllerFindAll, EventDto } from "@api-client-shop";
import { ToastrService } from 'ngx-toastr';
import { ImageCardComponent } from '../../components/image-card/image-card.component';
import { getEventStatus } from '../../shared/utils/event-status.util';

@Component({
    selector: 'app-home',
    imports: [CommonModule, RouterLink, ImageCardComponent],
    templateUrl: './home.page.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomePage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly toast = inject(ToastrService);

    events = signal<EventDto[]>([]);

    readonly getEventStatus = getEventStatus;

    async ngOnInit(): Promise<void> {
        try {
            const result = await this.api.invoke(eventControllerFindAll, {
                page: 1,
                limit: 4,
            });
            this.events.set(result.items ?? []);
        } catch (error) {
            console.error('행사 목록 조회 실패', error);
            this.toast.error('데이터를 불러오지 못했습니다.');
        }
    }

    goEventDetail(event: EventDto): void {
        this.router.navigate(['/event', event.id]);
    }
}
