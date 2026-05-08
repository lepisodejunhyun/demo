# Signal 기반 상태관리 — AdminStore

**파일 위치:** `apps/admin/src/app/stores/admin.store.ts`

---

## 상태관리란?

앱에서 여러 컴포넌트가 공유해야 하는 데이터를 관리하는 것이에요.

예를 들어 로그인한 사용자 정보:

```
로그인 페이지 → 로그인 성공 → 사용자 정보 저장
    ↓ 저장된 정보를
대시보드 → "홍길동님 환영합니다" 표시
    ↓ 같은 정보를
사이드바 → 사용자 이름과 권한 표시
    ↓ 같은 정보를
헤더 → 프로필 이미지 표시
```

이 데이터를 각 컴포넌트에 따로따로 저장하면 동기화가 어려워요. 한 곳에서 관리하고 필요한 컴포넌트들이 구독(watching)하는 방식을 써요.

---

## 실제 코드

```typescript
import { computed, Injectable, signal } from "@angular/core";
import type { AdminDto } from '@api-client';

@Injectable({ providedIn: 'root' })
export class AdminStore {
  private readonly state = signal<{ user: AdminDto | null }>({ user: null });

  readonly user = computed(() => this.state().user);

  setUser(user: AdminDto): void {
    this.state.update(s => ({ ...s, user }));
  }

  clearUser(): void {
    this.state.update(s => ({ ...s, user: null }));
  }
}
```

---

## Signal이란?

Angular 17에서 도입된 새로운 반응성 시스템이에요.

**Signal의 핵심:** 값이 바뀌면 그 값을 사용하는 곳을 자동으로 업데이트해줘요.

---

### `signal()` — 반응형 값 만들기

```typescript
private readonly state = signal<{ user: AdminDto | null }>({ user: null });
```

`signal(초기값)` 으로 반응형 값을 만들어요.

```typescript
// 일반 변수 (반응성 없음)
let count = 0;
count = 5;  // 화면이 자동으로 업데이트 안 됨

// Signal (반응성 있음)
const count = signal(0);
count.set(5);  // 이 값을 사용하는 화면이 자동으로 업데이트 됨!
```

---

### Signal 값 읽기 — `()` 호출

```typescript
this.state()        // 현재 state 값 읽기
this.state().user   // state 안의 user 값 읽기
```

Signal은 **함수처럼 호출**해서 값을 읽어요.

```typescript
const count = signal(0);
console.log(count);    // [Function] ← 함수 자체
console.log(count());  // 0          ← 실제 값
```

처음엔 헷갈리지만, `()` 를 붙이면 "값을 꺼내겠다"라고 기억하면 돼요.

---

### Signal 값 수정 — `set()`, `update()`

```typescript
// set(): 새 값으로 교체
count.set(10);

// update(): 이전 값을 기반으로 변경
count.update(prev => prev + 1);  // 이전 값 + 1
```

이 프로젝트에서:

```typescript
this.state.update(s => ({ ...s, user }));
// s = 현재 state 값 { user: null }
// ...s = 기존 속성들을 그대로 펼치기
// user = 새로운 user 값으로 덮어쓰기
// 결과: { user: 새로운AdminDto }
```

`...s` (스프레드 연산자) — 객체를 펼쳐서 복사해요.

```typescript
const s = { user: null, loading: false };
const newS = { ...s, user: adminData };
// newS = { user: adminData, loading: false }
// loading은 그대로, user만 교체됨
```

---

## `computed()` — 파생값 만들기

```typescript
readonly user = computed(() => this.state().user);
```

`computed()`는 **다른 Signal에서 파생된 값**이에요.

```typescript
const state = signal({ user: null, loading: false });
const user = computed(() => state().user);
// user는 state.user를 가리키는 파생값
// state가 바뀌면 user도 자동으로 바뀜
```

**왜 `state().user`를 직접 쓰지 않고 `computed`를 쓰냐?**

```typescript
// 직접 접근 (이렇게 해도 되지만)
this.adminStore.state().user  // state 전체가 노출됨

// computed 사용 (더 안전)
this.adminStore.user()        // user만 노출됨, state 내부 구조 숨김
```

`state`는 `private`으로 숨기고, `user`는 `readonly`로 외부에 공개해요. 내부 구조를 감추고 필요한 것만 노출하는 좋은 패턴이에요.

---

## `@Injectable({ providedIn: 'root' })` — 전역 싱글톤

```typescript
@Injectable({ providedIn: 'root' })
export class AdminStore { ... }
```

`providedIn: 'root'` → 앱 전체에서 딱 하나의 인스턴스만 존재 (싱글톤)

```
SignInPage에서 AdminStore 주입받음 → 인스턴스 A 생성
DashboardComponent에서 AdminStore 주입받음 → 인스턴스 A 공유 (새로 만들지 않음!)
HeaderComponent에서 AdminStore 주입받음 → 인스턴스 A 공유
```

모든 컴포넌트가 같은 인스턴스를 공유하기 때문에, 어느 컴포넌트에서 `setUser()`를 호출하면 다른 모든 컴포넌트에서 즉시 반영돼요.

`app.config.ts`의 `providers`에 추가하지 않아도 돼요. `providedIn: 'root'`가 있으면 자동으로 루트 수준에서 제공돼요.

---

## 실제 사용 예시

### 로그인 컴포넌트 (값 저장)

```typescript
@Component({ ... })
export class SignInPage {
  constructor(
    private adminStore: AdminStore,
    private router: Router
  ) {}

  async onSubmit() {
    const result = await adminControllerSignin({
      body: { email: '...', password: '...' }
    });

    // 로그인 성공 시 store에 저장
    this.adminStore.setUser(result.data);

    // 대시보드로 이동
    this.router.navigate(['/dashboard']);
  }
}
```

### 헤더 컴포넌트 (값 읽기)

```typescript
@Component({
  template: `
    <header>
      <span>{{ user()?.name }}님 환영합니다</span>
      <button (click)="logout()">로그아웃</button>
    </header>
  `
})
export class HeaderComponent {
  constructor(private adminStore: AdminStore) {}

  // computed signal을 컴포넌트에서 직접 사용
  user = this.adminStore.user;

  logout() {
    this.adminStore.clearUser();
  }
}
```

`{{ user()?.name }}` — 템플릿에서 Signal 값 읽기 (`.()` 호출 필요)

---

## Signal vs 예전 방식 (Observable) 비교

**예전 방식 (RxJS Observable):**

```typescript
// 복잡한 설정이 필요했음
private userSubject = new BehaviorSubject<AdminDto | null>(null);
user$ = this.userSubject.asObservable();

// 컴포넌트에서
this.store.user$.subscribe(user => {
  this.user = user;  // 수동으로 변수 업데이트
});

// 템플릿에서
<span>{{ user?.name }}</span>  // async pipe 또는 subscribe 필요
```

**현재 방식 (Signal):**

```typescript
// 간단한 설정
private state = signal({ user: null });
user = computed(() => this.state().user);

// 컴포넌트에서 subscribe 불필요
user = this.adminStore.user;  // 그냥 할당

// 템플릿에서
<span>{{ user()?.name }}</span>  // () 호출만 추가
```

Signal 방식이 훨씬 간결하고 직관적이에요.

---

## AdminStore 전체 구조 정리

```typescript
AdminStore
  │
  ├── state (private, signal)          // 상태 저장소 (외부 접근 불가)
  │   └── { user: AdminDto | null }    // 현재 저장된 사용자 정보
  │
  ├── user (readonly, computed)        // 외부 읽기 전용 파생값
  │   └── () => state().user           // state에서 user만 꺼냄
  │
  ├── setUser(user)                    // 로그인 성공 시 호출
  │   └── state.update(s => {..., user}) // user 업데이트
  │
  └── clearUser()                      // 로그아웃 시 호출
      └── state.update(s => {..., user: null}) // user 초기화
```

---

## Signal 핵심 정리

| 개념 | 사용법 | 설명 |
|------|--------|------|
| `signal(초기값)` | `const s = signal(0)` | 반응형 값 생성 |
| 값 읽기 | `s()` | 함수 호출로 현재 값 반환 |
| 값 변경 | `s.set(새값)` | 새 값으로 교체 |
| 값 업데이트 | `s.update(prev => ...)` | 이전 값 기반 변경 |
| `computed()` | `computed(() => s().field)` | Signal에서 파생된 읽기 전용 값 |
| 반응성 | 자동 | Signal 값이 바뀌면 사용하는 곳 자동 업데이트 |
