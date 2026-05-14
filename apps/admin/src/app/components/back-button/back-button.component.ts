import { Location } from "@angular/common";
import { Component, inject } from "@angular/core";

@Component({
    selector: 'app-back-button',
    templateUrl: './back-button.component.html',
    imports: [],
})
export class BackButtonComponent {
    private readonly location = inject(Location);

    goBack(): void {
        this.location.back();
    }
}
