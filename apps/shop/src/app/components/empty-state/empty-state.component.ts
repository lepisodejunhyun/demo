import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="text-center py-20">
      <span class="material-symbols-outlined text-outline text-[48px] mb-4">{{ icon() }}</span>
      <p class="text-on-surface-variant">{{ message() }}</p>
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  icon = input<string>('inbox');
  message = input<string>('등록된 항목이 없습니다.');
}
