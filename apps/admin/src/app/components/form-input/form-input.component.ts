import { Component, computed, forwardRef, input, signal } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { formatPhoneNumber, formatBusinessNumber } from "@org/shared/utils";

@Component({
    selector: 'app-form-input',
    templateUrl: './form-input.component.html',
    styleUrl: './form-input.component.css',
    host: { 'class': 'contents' },
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FormInputComponent),
            multi: true,
        },
    ],
})
export class FormInputComponent implements ControlValueAccessor {
    type = input<'text' | 'email' | 'date' | 'time' | 'tel' | 'biznum'>('text');
    maxlength = input<number | null>(null);
    placeholder = input<string>('');

    value = signal('');
    disabled = signal(false);
    isPicker = computed(() => this.type() === 'date' || this.type() === 'time');

    private onChange: (value: string) => void = () => { };
    private onTouched: () => void = () => { };

    onInput(event: Event): void {
        let val = (event.target as HTMLInputElement).value;
        if (this.type() === 'tel') {
            val = formatPhoneNumber(val);
            (event.target as HTMLInputElement).value = val;
        } else if (this.type() === 'biznum') {
            val = formatBusinessNumber(val);
            (event.target as HTMLInputElement).value = val;
        }
        this.value.set(val);
        this.onChange(val);
    }


    onBlur(): void {
        this.onTouched();
    }

    onClick(event: Event): void {
        if (this.isPicker()) {
            (event.target as HTMLInputElement).showPicker?.();
        }
    }

    writeValue(value: string): void {
        let val = value ?? '';
        if (this.type() === 'date' && val.length > 10) {
            val = val.slice(0, 10);
        }
        this.value.set(val);
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