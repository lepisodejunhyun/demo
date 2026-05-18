import { inject, Injectable, signal } from '@angular/core';
import { Api, memberControllerSignin, memberControllerLogout, memberControllerMe, kakaoAuthControllerKakaoLogin, MemberDto } from '@api-client-shop';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(Api);
  private readonly _currentUser = signal<MemberDto | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  get isLoggedIn(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('access_token') !== null;
  }

  get accessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }


  async signIn(email: string, password: string): Promise<void> {
    const result = await this.api.invoke(memberControllerSignin, {
      body: { email, password },
    });
    localStorage.setItem('access_token', result.accessToken);
    if (result.member) {
      this._currentUser.set(result.member);
    }
  }

  async loadCurrentUser(): Promise<void> {
    if (!this.isLoggedIn) return;
    try {
      this._currentUser.set(await this.api.invoke(memberControllerMe, {}));
    } catch {
      this.clearAuth();
    }
  }

  async kakaoLogin(code: string): Promise<void> {
    const result = await this.api.invoke(kakaoAuthControllerKakaoLogin, {
      body: { code },
    });
    localStorage.setItem('access_token', result.accessToken);
    if (result.member) {
      this._currentUser.set(result.member);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.invoke(memberControllerLogout, {});
    } catch {
    }
    this.clearAuth();
  }

  private clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
    this._currentUser.set(null);
  }
}
