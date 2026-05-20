import { Injectable, signal } from "@angular/core";
import { ToastConfig, ToastItem } from "./toast.model";

@Injectable({ providedIn: 'root' })
export class ToastService {
    private nextId = 0;
    readonly toasts = signal<ToastItem[]>([]);

    show(config: ToastConfig): void {
        const toast: ToastItem = {
            ...config,
            id: this.nextId++,
            duration: config.duration ?? 3000,
        };
        this.toasts.update((list) => [...list, toast]);

        setTimeout(() => this.dismiss(toast.id), toast.duration);
    }

    dismiss(id: number): void {
        this.toasts.update((list) => list.filter((t) => t.id !== id));
    }

    success(message: string, duration?: number): void {
        this.show({ message, type: 'success', duration });
    }

    error(message: string, duration?: number): void {
        this.show({ message, type: 'error', duration: duration ?? 5000 });
    }

    warning(message: string, duration?: number): void {
        this.show({ message, type: 'warning', duration });
    }

    info(message: string, duration?: number): void {
        this.show({ message, type: 'info', duration });
    }
}
