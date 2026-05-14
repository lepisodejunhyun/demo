import { Injectable } from "@angular/core";

const ACCESS_TOKEN_KEY = 'accessToken';
const USER_KEY = 'adminUser';

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

    getStoredUser(): any | null {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    }

    setStoredUser(user: any): void {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    removeStoredUser(): void {
        localStorage.removeItem(USER_KEY);
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    clear(): void {
        this.removeToken();
        this.removeStoredUser();
    }

}
