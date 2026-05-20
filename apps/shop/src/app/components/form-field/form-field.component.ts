import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  template: `
    <div>
      <label [for]="for()" class="block text-sm font-semibold text-on-surface mb-2">
        {{ label() }}
        @if (required()) {
          <span class="text-error">*</span>
        }
      </label>
      <ng-content />
      <ng-content select="[slot=error]" />
    </div>
  `,
})
export class FormFieldComponent {
  label = input.required<string>();
  for = input<string>('');
  required = input<boolean>(false);
}
