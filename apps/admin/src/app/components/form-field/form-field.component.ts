import { Component, input } from "@angular/core";
import { AbstractControl } from "@angular/forms";

@Component({
    selector: 'app-form-field',
    templateUrl: './form-field.component.html',
    host: { 'style': 'display: block' },
})
export class FormFieldComponent {
    label = input.required<string>();
    for = input<string>('');
    required = input<boolean>(false);
    control = input<AbstractControl | null>(null);

    get showError(): boolean {
        const c = this.control();
        return !!c && !!c.errors?.['required'] && c.touched;
    }
}
