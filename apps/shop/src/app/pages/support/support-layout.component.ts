import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-support',
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './support-layout.component.html',
})
export default class SupportLayoutComponent {}
