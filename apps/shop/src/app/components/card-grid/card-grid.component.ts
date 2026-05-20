import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card-grid',
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      @if (!isEmpty()) {
        <ng-content />
      } @else {
        <div class="col-span-full py-20 text-center text-slate-500">
          <div class="flex flex-col items-center gap-3">
            <span class="material-symbols-outlined text-5xl opacity-50">{{ emptyIcon() }}</span>
            <p class="text-sm">{{ emptyMessage() }}</p>
            <ng-content select="[slot=empty-action]" />
          </div>
        </div>
      }
    </div>
  `,
})
export class CardGridComponent {
  isEmpty = input<boolean>(false);
  emptyIcon = input<string>('inbox');
  emptyMessage = input<string>('등록된 항목이 없습니다.');
}
