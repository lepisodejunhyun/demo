import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Api, faqControllerFindAll, FaqDto } from "@api-client";

@Component({
    selector: 'app-faq',
    templateUrl: './faq.page.html',
    imports: [CommonModule, RouterLink],
})
export default class FaqPage implements OnInit {

    private readonly api = inject(Api);
    private readonly cdr = inject(ChangeDetectorRef);

    faqs: FaqDto[] = [];

    async ngOnInit() {
        try {
            this.faqs = await this.api.invoke(faqControllerFindAll, {});
            this.cdr.markForCheck();
        } catch (error) {
            console.error('FAQ 목록 조회 실패', error);
        }
    }
}