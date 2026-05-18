import { computed, inject, Injectable, signal } from "@angular/core";
import type { AdminDto } from '@api-client';
import { AuthService } from "../services/auth.service";

@Injectable({ providedIn: 'root' })
export class AdminStore {
  private readonly authService = inject(AuthService);
  private readonly state = signal<{ admin: AdminDto | null}>({
    admin: this.authService.getStoredAdmin(),
  });

  readonly admin = computed(() => this.state().admin);

  setAdmin(admin: AdminDto): void {
    this.state.update(s => ({ ...s, admin}));
    this.authService.setStoredAdmin(admin);
  }

  clearAdmin(): void {
    this.state.update(s => ({ ...s, admin: null }));
    this.authService.clear();
  }

}
