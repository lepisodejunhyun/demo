import { Component, input, output } from "@angular/core";

@Component({
    selector: 'app-image-upload',
    templateUrl: './image-upload.component.html',
})
export class ImageUploadComponent {
    inputId = input.required<string>();
    preview = input<string | null>(null);
    uploading = input<boolean>(false);
    accept = input<string>('.jpg,.jpeg,.png');
    hint = input<string>('JPG, PNG (최대 5MB)');

    fileSelected = output<File>();

    onFileChange(event: Event): void {
        const el = event.target as HTMLInputElement;
        const file = el.files?.[0];
        if (!file) return;
        this.fileSelected.emit(file);
        el.value = '';
    }
}
