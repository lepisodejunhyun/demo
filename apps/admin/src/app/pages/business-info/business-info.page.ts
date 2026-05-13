import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { Api } from "@api-client";
import { Router } from "@angular/router";

@Component({
    selector: 'app-business-info',
    templateUrl: './business-info.page.html',
    imports: [CommonModule, PageHeaderComponent]
})
export default class BusinessInfoPage {
    private readonly api = inject(Api);
    private readonly router = inject(Router);

}