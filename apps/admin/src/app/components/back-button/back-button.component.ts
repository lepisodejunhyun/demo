import { Component, inject, input } from "@angular/core";
import { Router } from "@angular/router";

@Component({
    selector: 'app-back-button',
    templateUrl: './back-button.component.html',
    imports: [],
})
export class BackButtonComponent {
    private readonly router = inject(Router);

    listUrl = input.required<string>();

    goBack(): void {
        this.router.navigate([this.listUrl()]);
    }
}
