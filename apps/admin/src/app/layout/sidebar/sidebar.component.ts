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

    menuItems = [
        { label: '대시보드', icon: 'dashboard', path: '/dashboard' },
        { label: 'FAQ 관리', icon: 'quiz', path: '/faq' },
        { label: '공지사항 관리', icon: 'campaign', path: '/notice' },
        { label: '행사 관리', icon: 'event', path: '/event' },
        { label: '사전 등록 관리', icon: 'how_to_reg', path: '/pre-registration' },
        { label: '갤러리 관리', icon: 'photo_library', path: '/gallery' },
        { label: '사업자 정보', icon: 'business', path: '/business-info' },
        { label: '약관 관리', icon: 'description', path: '/terms' },
        { label: '1:1 문의', icon: 'chat', path: '/inquiry' },
    ]

    logout() {
        this.adminStore.clearUser();
        this.router.navigate(['/sign-in']);

    }
}