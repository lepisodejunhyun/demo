import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    selector: 'app-back-link',
    templateUrl: './back-link.component.html',
    imports: [RouterLink],
})
export class BackLinkComponent {
    link = input.required<string>();
    text = input<string>('목록으로 돌아가기');
}
