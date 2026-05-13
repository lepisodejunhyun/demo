import { Component, input, output } from "@angular/core";

@Component({
    selector: 'app-form-actions',
    templateUrl: './form-actions.component.html',
})
export class FormActionsComponent {
    submitText = input<string>('등록하기');

    cancel = output<void>();
    submit = output<void>();

    onCancel(): void {
        this.cancel.emit();
    }

    onSubmit(): void {
        this.submit.emit();
    }
}
