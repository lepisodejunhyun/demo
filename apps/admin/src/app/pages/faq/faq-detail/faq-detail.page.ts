import { CommonModule } from "@angular/common";
import { Component, inject, input, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Api, faqControllerFindById, FaqDto } from "@api-client";

@Component({
    selector: 'app-faq-detail',
    templateUrl: './faq-detail.page.html',
    imports: [CommonModule]
})
export default class FaqDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);

    id = input<string>();

    faq: FaqDto | null = null;

    async ngOnInit() {
        const id = this.id();

        if (!id) return;

        try {
            this.faq = await this.api.invoke(faqControllerFindById, {
                id: id,
            });
        } catch (error) {
            console.error('FAQ 조회 실패', error);

            this.router.navigate(['/faq']);
        }
    }
}