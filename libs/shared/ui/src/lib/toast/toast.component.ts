import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ToastService } from "./toast.service";

@Component({
  selector: 'ui-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  getIcon(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '';
    }
  }
}
