import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Breadcrumb } from "../detail-layout/detail-layout.component";

@Component({
    selector: 'app-form-layout',
    templateUrl: './form-layout.component.html',
    imports: [CommonModule, RouterLink],
})
export class FormLayoutComponent {
    breadcrumbs = input.required<Breadcrumb[]>();
    title = input.required<string>();
    description = input<string>('');
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