import { Component, forwardRef, input, signal } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
    selector: 'app-form-textarea',
    templateUrl: './form-textarea.component.html',
    styleUrl: './form-textarea.component.css',
    host: { 'class': 'contents' },
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FormTextareaComponent),
            multi: true,
        },
    ],
})
export class FormTextareaComponent implements ControlValueAccessor {
    rows = input<number>(6);
    maxlength = input<number | null>(null);
    placeholder = input<string>('');

    value = signal('');
    disabled = signal(false);

    private onChange: (value: string) => void = () => { };
    private onTouched: () => void = () => { };

    onInput(event: Event): void {
        const val = (event.target as HTMLTextAreaElement).value;
        this.value.set(val);
        this.onChange(val);
    }

    onBlur(): void {
        this.onTouched();
    }

    writeValue(value: string): void {
        this.value.set(value ?? '');
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }
}
