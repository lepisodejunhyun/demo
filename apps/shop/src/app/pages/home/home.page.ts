import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { Api, eventControllerFindAll, EventDto } from "@api-client-shop";

@Component({
    selector: 'app-home',
    imports: [CommonModule, RouterLink],
    templateUrl: './home.page.html',
})
export default class HomePage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    events: EventDto[] = [];

    async ngOnInit() {
        try {
            const result = await this.api.invoke(eventControllerFindAll, {
                page: 1,
                limit: 4,
            });
            this.events = result.items ?? [];
            this.cdr.markForCheck();
        } catch (error) {
            console.error('행사 목록 조회 실패', error);
        }
    }

    goEventDetail(event: EventDto): void {
        this.router.navigate(['/event', event.id]);
    }

    getStatus(event: EventDto): { label: string; class: string } {
        const now = new Date();
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);

        if (now < start) {
            return { label: '예정', class: 'bg-blue-100 text-blue-700' };
        } else if (now > end) {
            return { label: '종료', class: 'bg-slate-100 text-slate-500' };
        } else {
            return { label: '진행중', class: 'bg-emerald-100 text-emerald-700' };
        }
    }
}
