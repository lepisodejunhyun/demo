import { Component, input, output } from "@angular/core";
import { ButtonComponent } from "../button/button.component";

@Component({
    selector: 'app-empty-state',
    templateUrl: './empty-state.component.html',
    imports: [ButtonComponent],
})
export class EmptyStateComponent {
    icon = input.required<string>();
    title = input.required<string>();
    description = input<string | null>(null);
    actionLabel = input<string | null>(null);
    action = output<void>();

    onAction(): void {
        this.action.emit();
    }
}
