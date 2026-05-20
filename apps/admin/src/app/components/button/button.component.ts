import { Component, computed, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";

export type ButtonVariant = 'primary' | 'ghost-primary' | 'ghost-error';

@Component({
    selector: 'app-button',
    templateUrl: './button.component.html',
    imports: [CommonModule, RouterLink],
})
export class ButtonComponent {
    variant = input<ButtonVariant>('primary');
    icon = input<string | null>(null);
    label = input<string>();
    link = input<string | null>(null);

    action = output<void>();

    classes = computed(() => {
        const base = 'flex items-center font-semibold text-xs rounded transition-colors cursor-pointer';
        const variants: Record<ButtonVariant, string> = {
            'primary': 'gap-2 px-6 py-2.5 bg-primary-container text-white hover:bg-primary',
            'ghost-primary': 'gap-1 px-4 py-2 text-primary hover:bg-surface-container-low',
            'ghost-error': 'gap-1 px-4 py-2 text-error border border-transparent hover:bg-error-container/20',
        };
        return `${base} ${variants[this.variant()]}`;
    });

    onClick(): void {
        this.action.emit();
    }
}
