import { Component, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    selector: 'app-detail-actions',
    templateUrl: './detail-actions.component.html',
    imports: [RouterLink],
})
export class DetailActionsComponent {
    editLink = input<string>('');
    backLink = input.required<string>();

    delete = output<void>();

    onDelete(): void {
        this.delete.emit();
    }
}
