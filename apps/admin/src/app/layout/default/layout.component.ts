import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { SidebarLayout } from "../sidebar/sidebar.component";
import { HeaderLayout } from "../header/header.component";

@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    imports: [CommonModule, RouterModule, SidebarLayout, HeaderLayout],
})
export default class DefaultLayout {
    private readonly router = inject(Router);


}