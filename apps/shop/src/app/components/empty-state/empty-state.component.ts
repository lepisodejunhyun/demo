import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
  icon = input<string>('inbox');
  message = input<string>('등록된 항목이 없습니다.');
}
