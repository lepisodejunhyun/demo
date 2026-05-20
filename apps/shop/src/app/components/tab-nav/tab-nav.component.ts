import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface TabItem {
  label: string;
  link?: string;
  id?: string;
}

@Component({
  selector: 'app-tab-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './tab-nav.component.html',
})
export class TabNavComponent {
  items = input.required<TabItem[]>();
  activeId = input<string | null>(null);
  tabChange = output<string>();
}
