/**
 * ============================================================
 * [ Angular Store(상태 관리)란? ]
 * 앱 전체에서 공유해야 하는 데이터를 한 곳에서 관리하는 저장소.
 *
 * 비유: 앱 전체가 쓰는 "공용 게시판".
 *   → 로그인 페이지에서 사용자 정보를 게시판에 적으면,
 *     대시보드, 헤더, 사이드바 등 어디서든 그 정보를 읽을 수 있음.
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. @Injectable({ providedIn: 'root' }) — 앱 전체에서 하나만 존재하는 서비스 (싱글톤)
 * 2. signal()    — Angular의 최신 반응형 상태 관리 도구
 * 3. computed()  — signal에서 파생된 읽기 전용 값
 * 4. update()    — signal의 값을 변경하는 메서드
 * ============================================================
 */

import { computed, Injectable, signal } from "@angular/core";
import type { AdminDto } from '@api-client';

/**
 * @Injectable({ providedIn: 'root' })
 *
 * @Injectable → "이 클래스는 주입 가능한 서비스다"
 * providedIn: 'root' → "앱 전체에서 하나만 만들어서 공유해줘" (싱글톤)
 *
 * NestJS의 @Injectable()과 비슷하지만, Angular에서는 providedIn으로
 * 별도 Module 등록 없이도 자동으로 사용 가능.
 *
 * 싱글톤이란?
 * → 앱이 실행되는 동안 이 클래스의 인스턴스가 딱 1개만 존재.
 * → 로그인 페이지에서 setUser()로 저장한 데이터를
 *   대시보드 페이지에서 user()로 읽으면 같은 데이터가 나옴.
 */
@Injectable({ providedIn: 'root' })
export class AdminStore {
  /**
   * [ signal() — Angular의 반응형 상태 관리 ]
   *
   * signal = "값이 바뀌면 화면도 자동으로 업데이트되는 변수".
   *
   * 일반 변수와의 차이:
   *   일반 변수: let user = null;  → 값이 바뀌어도 화면은 모름.
   *   signal:    signal({ user: null }) → 값이 바뀌면 화면이 자동 갱신.
   *
   * 사용법:
   *   읽기: this.state()        → 현재 값 반환 (함수 호출 형태!)
   *   쓰기: this.state.update() → 값 변경
   *
   * private → 외부에서 직접 접근 불가. setUser/clearUser 메서드로만 변경 가능.
   *           이렇게 하면 "누가 어디서 값을 바꿨는지" 추적하기 쉬움.
   *
   * 타입: { user: AdminDto | null }
   *   AdminDto → 서버에서 받은 관리자 정보 타입 (자동 생성됨)
   *   | null   → 로그인 전에는 사용자 정보가 없으므로 null 허용
   */
  private readonly state = signal<{ user: AdminDto | null}>({ user: null });

  /**
   * [ computed() — signal에서 파생된 읽기 전용 값 ]
   *
   * state 전체({ user: ... })에서 user만 꺼내서 제공.
   * 외부에서는 adminStore.user()로 사용자 정보에 접근.
   *
   * 왜 computed를 쓰나?
   * → state에 나중에 다른 필드가 추가되더라도 (예: { user, settings, ... })
   *   외부에서는 adminStore.user()만 쓰면 되므로 영향 없음.
   * → state 구조 변경에 대한 보호막 역할.
   *
   * readonly → 이 변수 자체를 다른 값으로 재할당하는 것을 방지.
   *            (computed 내부의 값은 state가 바뀌면 자동으로 바뀜)
   */
  readonly user = computed(() => this.state().user);

  /**
   * [ 상태 변경 메서드 — setUser ]
   * 로그인 성공 시 호출. 서버에서 받은 사용자 정보를 저장.
   *
   * state.update(콜백함수)
   *   s = 현재 상태 값
   *   { ...s, user } = 기존 상태를 복사하고, user만 새 값으로 교체.
   *                     (스프레드 연산자 ...로 불변성 유지)
   *
   * 불변성(Immutability)이란?
   * → 기존 객체를 직접 수정하지 않고, 새 객체를 만들어서 교체하는 패턴.
   * → s.user = user (X) 직접 수정 — Angular가 변화를 감지 못할 수 있음.
   * → { ...s, user } (O) 새 객체 생성 — Angular가 변화를 확실히 감지.
   */
  setUser(user: AdminDto): void {
    this.state.update(s => ({ ...s, user}));
  }

  /**
   * [ 상태 변경 메서드 — clearUser ]
   * 로그아웃 시 호출. 사용자 정보를 null로 초기화.
   */
  clearUser(): void {
    this.state.update(s => ({ ...s, user: null }));
  }

}
