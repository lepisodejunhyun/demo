import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  host: { class: 'block' }
})
export class FormFieldComponent {
  label = input.required<string>();
  for = input<string>('');
  required = input<boolean>(false);
}
