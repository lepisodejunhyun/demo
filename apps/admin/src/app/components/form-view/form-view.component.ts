import { Component, ElementRef, inject, input, output } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { FormActionsComponent } from "../form-actions/form-actions.component";

@Component({
    selector: 'app-form-view',
    templateUrl: './form-view.component.html',
    imports: [ReactiveFormsModule, FormActionsComponent],
})
export class FormViewComponent {
    private readonly el = inject(ElementRef);

    formGroup = input.required<FormGroup>();
    submitText = input<string>('등록하기');

    cancel = output<void>();
    submit = output<void>();

    onCancel(): void {
        this.cancel.emit();
    }

    onSubmit(): void {
        const fg = this.formGroup();
        fg.markAllAsTouched();
        this.submit.emit();
        if (fg.invalid) {
            setTimeout(() => {
                const el = this.el.nativeElement as HTMLElement;
                const focusTarget = el.querySelector<HTMLElement>(
                    'app-form-input.ng-invalid input, app-form-textarea.ng-invalid textarea, select.ng-invalid:not([disabled])'
                );
                if (focusTarget) {
                    focusTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    focusTarget.focus();
                }
            }, 0);
        }
    }
}
