import { Component, computed, input } from "@angular/core";

export type StatusBadgeVariant = 'error' | 'neutral' | 'primary' | 'outline';
export type StatusBadgeSize = 'sm' | 'xs';

@Component({
    selector: 'app-status-badge',
    templateUrl: './status-badge.component.html',
})
export class StatusBadgeComponent {
    label = input.required<string>();
    variant = input<StatusBadgeVariant>('neutral');
    icon = input<string | null>(null);
    size = input<StatusBadgeSize>('sm');
    pill = input<boolean>(false);

    classes = computed(() => {
        const base = 'inline-flex items-center gap-1 font-bold';
        const sizeClass = this.size() === 'xs'
            ? 'text-[10px] px-1.5 py-0.5'
            : 'text-xs px-2.5 py-1';
        const shape = this.pill() ? 'rounded-full font-medium' : 'rounded';
        const variantClass: Record<StatusBadgeVariant, string> = {
            error: 'text-error bg-error/10',
            neutral: 'text-on-surface-variant bg-surface-container-low',
            primary: 'text-primary bg-primary/10',
            outline: 'text-outline bg-outline/10',
        };
        return `${base} ${sizeClass} ${shape} ${variantClass[this.variant()]}`;
    });
}
