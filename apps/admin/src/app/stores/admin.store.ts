import { computed, Injectable, signal } from "@angular/core";
import type { AdminDto } from '@api-client';

@Injectable({ providedIn: 'root' })
export class AdminStore {
  private readonly state = signal<{ user: AdminDto | null}>({ user: null });

  readonly user = computed(() => this.state().user);

  setUser(user: AdminDto): void {
    this.state.update(s => ({ ...s, user}));
  }

  clearUser(): void {
    this.state.update(s => ({ ...s, user: null }));
  }

}
