import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    selector: 'app-back-button',
    templateUrl: './back-button.component.html',
    imports: [RouterLink],
})
export class BackButtonComponent {
    link = input.required<string>();
}
