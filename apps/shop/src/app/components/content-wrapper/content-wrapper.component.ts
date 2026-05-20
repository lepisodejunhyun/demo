import { Component, input } from '@angular/core';

@Component({
  selector: 'app-content-wrapper',
  template: `
    <div class="max-w-[1280px] mx-auto px-5 md:px-16" [class]="padding()">
      <ng-content />
    </div>
  `,
})
export class ContentWrapperComponent {
  padding = input<string>('py-10');
}
