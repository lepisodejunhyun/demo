import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";

@Component({
    selector: 'app-gallery',
    templateUrl: './gallery.page.html',
    imports: [CommonModule, PageHeaderComponent]
})
export default class GalleryPage {
}