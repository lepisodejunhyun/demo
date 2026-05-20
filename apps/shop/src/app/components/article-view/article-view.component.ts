import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-article-view',
  imports: [DatePipe],
  templateUrl: './article-view.component.html',
})
export class ArticleViewComponent {
  title = input.required<string>();
  createdAt = input<string>();
}
