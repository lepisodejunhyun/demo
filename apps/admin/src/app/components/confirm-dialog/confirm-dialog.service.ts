import { Injectable, signal } from "@angular/core";

export type DialogMode = 'alert' | 'confirm';
export type DialogVariant = 'error' | 'primary' | 'warning';

export interface DialogConfig {
    mode?: DialogMode;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: DialogVariant;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
    private resolver: ((value: boolean) => void) | null = null;

    config = signal<DialogConfig | null>(null);

    /** 확인 버튼만 있는 알림 */
    alert(config: Omit<DialogConfig, 'mode' | 'cancelLabel'>): Promise<void> {
        this.open({ ...config, mode: 'alert', confirmLabel: config.confirmLabel ?? '확인' });
        return new Promise(resolve => {
            this.resolver = () => resolve();
        });
    }

    /** 취소 + 확인 버튼이 있는 확인 */
    confirm(config: Omit<DialogConfig, 'mode'>): Promise<boolean> {
        this.open({
            ...config,
            mode: 'confirm',
            confirmLabel: config.confirmLabel ?? '확인',
            cancelLabel: config.cancelLabel ?? '취소',
            variant: config.variant ?? 'error',
        });
        return new Promise(resolve => {
            this.resolver = resolve;
        });
    }

    private open(config: DialogConfig): void {
        this.config.set(config);
    }

    resolve(value: boolean): void {
        this.config.set(null);
        this.resolver?.(value);
        this.resolver = null;
    }
}
