import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from "../../shared/services/auth.service";

@Component({
    selector: 'app-header',
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './header.component.html',
})
export default class HeaderComponent implements OnInit {
    readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    menuOpen = false;

    navItems = [
        { label: '홈', path: '/' },
        { label: '행사안내', path: '/event' },
        { label: '갤러리', path: '/gallery' },
        { label: '사전등록', path: '/pre-registration' },
        { label: '고객센터', path: '/support' },
    ];

    ngOnInit(): void {
        // 페이지 로드 시 로그인 상태면 사용자 정보 로드
        if (this.authService.isLoggedIn) {
            this.authService.loadCurrentUser();
        }
    }

    toggleMenu(): void {
        this.menuOpen = !this.menuOpen;
    }

    async onLogout(): Promise<void> {
        await this.authService.logout();
        this.cdr.markForCheck();
        this.router.navigate(['/']);
    }
}
