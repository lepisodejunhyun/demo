import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    selector: 'app-page-header',
    templateUrl: './page-header.component.html',
    imports: [RouterLink]
})
export class PageHeaderComponent {
    title = input.required<string>();
    description = input<string>('');
    buttonText = input<string>('');
    buttonLink = input<string>('');
}