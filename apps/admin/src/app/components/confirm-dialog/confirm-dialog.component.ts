import { Component, inject } from "@angular/core";
import { DialogService } from "./confirm-dialog.service";

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
    private readonly service = inject(DialogService);

    config = this.service.config;

    onConfirm(): void {
        this.service.resolve(true);
    }

    onCancel(): void {
        this.service.resolve(false);
    }
}
