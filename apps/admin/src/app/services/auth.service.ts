import { Injectable } from "@angular/core";

const ACCESS_TOKEN_KEY = 'accessToken';
const ADMIN_KEY = 'adminUser';

@Injectable({ providedIn: 'root' })
export class AuthService {

    getToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }

    setToken(token: string): void {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }

    removeToken(): void {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
    }

    getStoredAdmin(): any | null {
        const raw = localStorage.getItem(ADMIN_KEY);
        return raw ? JSON.parse(raw) : null;
    }

    setStoredAdmin(admin: any): void {
        localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    }

    removeStoredAdmin(): void {
        localStorage.removeItem(ADMIN_KEY);
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    clear(): void {
        this.removeToken();
        this.removeStoredAdmin();
    }

}
