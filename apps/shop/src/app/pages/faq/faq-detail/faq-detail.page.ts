import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
    selector: 'app-faq-detail',
    templateUrl: './faq-detail.page.html',
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FaqDetailPage {

}