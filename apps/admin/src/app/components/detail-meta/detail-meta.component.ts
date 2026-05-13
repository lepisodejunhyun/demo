import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";

@Component({
    selector: 'app-detail-meta',
    templateUrl: './detail-meta.component.html',
    imports: [CommonModule],
})
export class DetailMetaComponent {
    createdAt = input<string>('');
    updatedAt = input<string>('');
}
