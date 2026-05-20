import { Component, input } from '@angular/core';

@Component({
  selector: 'app-content-wrapper',
  templateUrl: './content-wrapper.component.html',
})
export class ContentWrapperComponent {
  padding = input<string>('py-10');
}
