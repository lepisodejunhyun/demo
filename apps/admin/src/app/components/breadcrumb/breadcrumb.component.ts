import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

export interface Breadcrumb {
    label: string;
    link?: string;
}

@Component({
    selector: 'app-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    imports: [RouterLink],
    host: { 'class': 'block' },
})
export class BreadcrumbComponent {
    items = input.required<Breadcrumb[]>();
}
