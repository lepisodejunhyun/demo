import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";

@Component({
    selector: 'app-page-title',
    templateUrl: './page-title.component.html',
    imports: [CommonModule],
})
export class PageTitleComponent {
    title = input.required<string>();
    description = input<string>('');
    createdAt = input<string>('');
    updatedAt = input<string>('');
}
