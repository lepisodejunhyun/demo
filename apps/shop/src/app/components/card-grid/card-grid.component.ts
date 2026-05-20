import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card-grid',
  templateUrl: './card-grid.component.html',
})
export class CardGridComponent {
  isEmpty = input<boolean>(false);
  emptyIcon = input<string>('inbox');
  emptyMessage = input<string>('등록된 항목이 없습니다.');
}
