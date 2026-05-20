import { Component, input } from '@angular/core';

@Component({
  selector: 'app-image-card',
  templateUrl: './image-card.component.html',
})
export class ImageCardComponent {
  imageUrl = input<string | null>();
  fallbackIcon = input<string>('image');
  alt = input<string>('');
}
