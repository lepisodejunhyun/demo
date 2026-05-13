import { Component, input, output } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { FormActionsComponent } from "../form-actions/form-actions.component";

@Component({
    selector: 'app-form-view',
    templateUrl: './form-view.component.html',
    imports: [ReactiveFormsModule, FormActionsComponent],
})
export class FormViewComponent {
    formGroup = input.required<FormGroup>();
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
