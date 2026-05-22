import { Component, input } from "@angular/core";
import { DetailMetaComponent } from "../detail-meta/detail-meta.component";
import { BackButtonComponent } from "../back-button/back-button.component";

@Component({
    selector: 'app-detail-view',
    templateUrl: './detail-view.component.html',
    imports: [DetailMetaComponent, BackButtonComponent],
})
export class DetailViewComponent {
    createdAt = input<string>('');
    updatedAt = input<string>('');
    listUrl = input.required<string>();
}
