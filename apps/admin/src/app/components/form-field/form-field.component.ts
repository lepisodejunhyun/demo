import { Component, input } from "@angular/core";

@Component({
    selector: 'app-form-field',
    templateUrl: './form-field.component.html',
})
export class FormFieldComponent {
    label = input.required<string>();
    for = input<string>('');
}
