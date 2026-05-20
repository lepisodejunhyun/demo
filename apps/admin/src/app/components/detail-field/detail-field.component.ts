import { Component, computed, input } from "@angular/core";

export type DetailFieldVariant = 'grid' | 'stack';

@Component({
    selector: 'app-detail-field',
    templateUrl: './detail-field.component.html',
    host: { 'style': 'display: contents' },
})
export class DetailFieldComponent {
    label = input.required<string>();
    variant = input<DetailFieldVariant>('grid');

    labelClass = computed(() => {
        return this.variant() === 'stack'
            ? 'text-sm text-on-surface-variant mb-1'
            : 'font-semibold text-on-surface-variant';
    });

    valueClass = computed(() => {
        return this.variant() === 'stack'
            ? 'text-base font-medium min-w-0 break-all'
            : 'min-w-0 break-all';
    });
}
