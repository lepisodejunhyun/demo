export interface ToastConfig {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

export interface ToastItem extends ToastConfig {
    id: number;
}
