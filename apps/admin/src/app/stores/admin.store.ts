import { computed, inject, Injectable, signal } from "@angular/core";
import type { AdminDto } from '@api-client';
import { AuthService } from "../services/auth.service";

@Injectable({ providedIn: 'root' })
export class AdminStore {
  private readonly authService = inject(AuthService);
  private readonly state = signal<{ user: AdminDto | null}>({
    user: this.authService.getStoredUser(),
  });

  readonly user = computed(() => this.state().user);

  setUser(user: AdminDto): void {
    this.state.update(s => ({ ...s, user}));
    this.authService.setStoredUser(user);
  }

  clearUser(): void {
    this.state.update(s => ({ ...s, user: null }));
    this.authService.clear();
  }

}
