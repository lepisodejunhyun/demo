import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { Api } from "@api-client";

import { PageHeaderComponent } from "../../components/page-header/page-header.component";

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.page.html',
    imports: [CommonModule, PageHeaderComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DashboardPage {
    private readonly api = inject(Api);
    private readonly router = inject(Router);




}