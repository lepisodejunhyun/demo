import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { AdminStore } from "../../stores/admin.store";

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    imports: [CommonModule, RouterModule],
})
export class SidebarLayout {
    private readonly router = inject(Router);
    private readonly adminStore = inject(AdminStore);

    logout() {
        this.adminStore.clearUser();
        this.router.navigate(['/sign-in']);

    }
}