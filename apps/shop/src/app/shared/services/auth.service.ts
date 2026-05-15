import { inject, Injectable } from '@angular/core';
import { Api, memberControllerSignin, memberControllerLogout, memberControllerMe, kakaoAuthControllerKakaoLogin, MemberDto } from '@api-client-shop';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(Api);
  private _currentUser: MemberDto | null = null;

  get isLoggedIn(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('access_token') !== null;
  }

  get accessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  get currentUser(): MemberDto | null {
    return this._currentUser;
  }

  async signIn(email: string, password: string): Promise<void> {
    const result = await this.api.invoke(memberControllerSignin, {
      body: { email, password },
    });
    localStorage.setItem('access_token', result.accessToken);
    if (result.member) {
      this._currentUser = result.member;
    }
  }

  async loadCurrentUser(): Promise<void> {
    if (!this.isLoggedIn) return;
    try {
      this._currentUser = await this.api.invoke(memberControllerMe, {});
    } catch {
      // 토큰이 만료된 경우 등
      this.clearAuth();
    }
  }

  async kakaoLogin(code: string): Promise<void> {
    const result = await this.api.invoke(kakaoAuthControllerKakaoLogin, {
      body: { code },
    });
    localStorage.setItem('access_token', result.accessToken);
    if (result.member) {
      this._currentUser = result.member;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.invoke(memberControllerLogout, {});
    } catch {
      // 서버 에러가 나더라도 클라이언트는 정리
    }
    this.clearAuth();
  }

  private clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
    this._currentUser = null;
  }
}
