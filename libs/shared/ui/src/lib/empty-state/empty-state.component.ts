import { Component, input, output } from "@angular/core";

@Component({
    selector: 'app-empty-state',
    templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
    icon = input<string>('inbox');
    title = input<string>('등록된 항목이 없습니다.');
    description = input<string | null>(null);
    actionLabel = input<string | null>(null);
    action = output<void>();

    onAction(): void {
        this.action.emit();
    }
}