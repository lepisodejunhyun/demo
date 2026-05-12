import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { Api, faqControllerFindById, faqControllerRemove, FaqDto } from "@api-client";

@Component({
    selector: 'app-faq-detail',
    templateUrl: './faq-detail.page.html',
    imports: [CommonModule, RouterLink]
})
export default class FaqDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    id = input<string>();

    faq: FaqDto | null = null;

    async ngOnInit() {
        const id = this.id();

        if (!id) return;

        try {
            this.faq = await this.api.invoke(faqControllerFindById, {
                id: id,
            });
            this.cdr.markForCheck();
        } catch (error) {
            console.error('FAQ 조회 실패', error);

            this.router.navigate(['/faq']);
        }

    }

    async onDelete() {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await this.api.invoke(faqControllerRemove, {
                id: this.faq!.id,
            });
            this.router.navigate(['/faq']);
        } catch (error) {
            console.error('FAQ 삭제 실패', error);
        }
    }
}
