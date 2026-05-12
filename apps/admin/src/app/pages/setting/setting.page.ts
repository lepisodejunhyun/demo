import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";

@Component({
    selector: 'app-setting',
    templateUrl: './setting.page.html',
    imports: [CommonModule, PageHeaderComponent],
})
export default class SettingPage {

}