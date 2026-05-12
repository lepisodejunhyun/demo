import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";

export interface Breadcrumb {
    label: string;
    link?: string;
}

@Component({
    selector: 'app-detail-layout',
    templateUrl: './detail-layout.component.html',
    imports: [CommonModule, RouterLink],
})
export class DetailLayoutComponent {
    breadcrumbs = input.required<Breadcrumb[]>();
    title = input.required<string>();
    createdAt = input<string>('');
    updatedAt = input<string>('');
    backLink = input.required<string>();
    editLink = input<string>('');

    delete = output<void>();

    onDelete(): void {
        this.delete.emit();
    }
}