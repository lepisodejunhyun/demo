import { Component, forwardRef, input, signal } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
    selector: 'app-form-toggle',
    templateUrl: './form-toggle.component.html',
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => FormToggleComponent),
        multi: true,
    }],
})
export class FormToggleComponent implements ControlValueAccessor {
    labelOn = input<string>('켜짐');
    labelOff = input<string>('꺼짐');
    inputId = input<string>('');

    value = signal<boolean>(false);
    isDisabled = signal<boolean>(false);

    private onChange = (_: boolean) => {};
    private onTouched = () => {};

    onToggle(event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        this.value.set(checked);
        this.onChange(checked);
        this.onTouched();
    }

    writeValue(val: boolean): void { this.value.set(!!val); }
    registerOnChange(fn: (_: boolean) => void): void { this.onChange = fn; }
    registerOnTouched(fn: () => void): void { this.onTouched = fn; }
    setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }
}
