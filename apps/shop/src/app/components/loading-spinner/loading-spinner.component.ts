import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
      <span class="material-symbols-outlined animate-spin text-4xl mb-4">autorenew</span>
      <p>{{ message() }}</p>
    </div>
  `,
})
export class LoadingSpinnerComponent {
  message = input<string>('불러오는 중입니다...');
}
