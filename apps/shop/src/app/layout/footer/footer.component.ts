import { Component, inject, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Api, businessInfoControllerFindOne, BusinessInfoDto, termsControllerFindAll, TermsDto } from "@api-client-shop";

@Component({
    selector: 'app-footer',
    imports: [RouterLink],
    templateUrl: './footer.component.html',
})
export default class FooterComponent implements OnInit {
    private readonly api = inject(Api);

    businessInfo: BusinessInfoDto | null = null;
    termsList: TermsDto[] = [];

    async ngOnInit(): Promise<void> {
        await this.loadData();
    }

    private async loadData(): Promise<void> {
        try {
            const [businessInfo, terms] = await Promise.all([
                this.api.invoke(businessInfoControllerFindOne, {}),
                this.api.invoke(termsControllerFindAll, {}),
            ]);
            this.businessInfo = businessInfo;
            this.termsList = terms;
        } catch {
            this.businessInfo = null;
            this.termsList = [];
        }
    }
}
