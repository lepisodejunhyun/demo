import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-form-actions',
  templateUrl: './form-actions.component.html',
})
export class FormActionsComponent {
  submitText = input<string>('등록하기');
  loading = input<boolean>(false);
  cancel = output();
  submit = output();
}
