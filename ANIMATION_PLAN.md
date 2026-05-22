# 애니메이션 적용 계획서

작성일: 2026-05-21
대상: `apps/admin`, `apps/shop`

---

## 전제 조건 (작업 전 확인)

- `provideAnimations()` 양쪽 앱 모두 **이미 설정 완료**
  - `apps/admin/src/app/app.config.ts` ✅
  - `apps/shop/src/app/app.config.ts` ✅
- Angular animations 패키지: `@angular/animations` (Angular 기본 포함)
- Tailwind 커스텀 keyframe: `apps/admin/src/styles.css` / `apps/shop/src/styles.css` 에 추가

---

## 구현 방식 기준

| 상황 | 방식 |
|---|---|
| 등장 + 퇴장 모두 필요 (다이얼로그, 라이트박스) | Angular `@angular/animations` |
| 아코디언 펼치기/접기 | Angular `@angular/animations` |
| 등장만 필요 (빈 상태, 완료 페이지, 목록 stagger) | CSS keyframe (`styles.css`) |

---

## 작업 목록 요약

| # | 위치 | 애니메이션 | 방식 | 우선순위 | 상태 |
|---|---|---|---|---|---|
| 1 | `confirm-dialog` (admin) | 백드롭 fade + 다이얼로그 scale | Angular animations | 🔴 High | 대기 |
| 2 | `gallery-detail` 라이트박스 (admin) | 백드롭 fade + 이미지 scale | Angular animations | 🔴 High | 대기 |
| 3 | FAQ 아코디언 (shop) | 내용 expand/collapse | Angular animations | 🔴 High | 대기 |
| 4 | 약관 아코디언 - pre-registration-form (shop) | 내용 expand/collapse | Angular animations | 🟡 Medium | 대기 |
| 5 | 사전등록 완료 페이지 (shop) | 체크 아이콘 bounce + 텍스트 순차 fade | CSS keyframe | 🟡 Medium | 대기 |
| 6 | Empty State (admin + shop) | 아이콘+텍스트 fade-in-up | CSS keyframe | 🟡 Medium | 대기 |
| 7 | 홈 히어로 섹션 (shop) | 텍스트/버튼 순차 fade-in-up | CSS keyframe | 🟢 Low | 대기 |
| 8 | Data Table 행 (admin) | staggered fade-in-up | CSS keyframe | 🟢 Low | 대기 |

---

## #1. Confirm Dialog 등장/퇴장 애니메이션 (admin)

### 현재 상태
`@if (config())` 조건으로 다이얼로그 전체가 즉시 나타남/사라짐.

### 목표
- 백드롭: opacity 0 → 1 (200ms)
- 다이얼로그: scale(0.95) + opacity(0) → scale(1) + opacity(1) (250ms, ease-out)
- 닫힐 때: 역방향 (150ms, ease-in)

### 구현

**`apps/admin/src/app/components/confirm-dialog/confirm-dialog.component.ts`** 수정:
```ts
import { Component, inject } from "@angular/core";
import { animate, style, transition, trigger } from "@angular/animations";
import { DialogService } from "./confirm-dialog.service";

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    templateUrl: './confirm-dialog.component.html',
    animations: [
        trigger('backdrop', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-out', style({ opacity: 1 })),
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0 })),
            ]),
        ]),
        trigger('dialog', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.95) translateY(-8px)' }),
                animate('250ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(-8px)' })),
            ]),
        ]),
    ],
})
export class ConfirmDialogComponent {
    private readonly service = inject(DialogService);
    config = this.service.config;
    onConfirm(): void { this.service.resolve(true); }
    onCancel(): void { this.service.resolve(false); }
}
```

**`apps/admin/src/app/components/confirm-dialog/confirm-dialog.component.html`** 수정:

`@if (config())` 블록 안의 백드롭 div와 다이얼로그 div에 각각 trigger 추가:
```html
@if (config()) {
<div class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div @backdrop class="absolute inset-0 bg-black/40 backdrop-blur-[2px]" (click)="onCancel()"></div>

    <!-- Dialog -->
    <div @dialog class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        ...기존 내용 그대로...
    </div>
</div>
}
```

### 주의사항
- `@if` 블록 내부 요소에 `@triggerName` 을 붙이면 `:enter`/`:leave` 가 동작함
- `@if` 블록 바깥 `<div>` 에는 trigger 붙여도 leave가 동작하지 않음 → 반드시 **내부 요소**에 붙일 것

---

## #2. 갤러리 라이트박스 등장/퇴장 (admin)

### 현재 상태
`gallery-detail.page.html` 하단의 `@if (selectedImage)` 블록이 즉시 나타남/사라짐.

현재 HTML (라이트박스 부분):
```html
@if (selectedImage) {
<div (click)="closeImage()" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer">
    <img [src]="selectedImage" class="max-w-[90vw] max-h-[90vh] object-contain" />
</div>
}
```

### 목표
- 배경: opacity 0 → 0.8 (200ms)
- 이미지: scale(0.9) + opacity(0) → scale(1) + opacity(1) (300ms, ease-out)

### 구현

**`apps/admin/src/app/pages/gallery/gallery-detail/gallery-detail.page.ts`** 수정:
```ts
import { animate, style, transition, trigger } from "@angular/animations";

@Component({
    ...
    animations: [
        trigger('lightbox', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-out', style({ opacity: 1 })),
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0 })),
            ]),
        ]),
        trigger('lightboxImage', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.9)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' })),
            ]),
        ]),
    ],
})
```

**`gallery-detail.page.html`** 라이트박스 부분 수정:
```html
@if (selectedImage) {
<div @lightbox (click)="closeImage()"
    class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer">
    <img @lightboxImage [src]="selectedImage" class="max-w-[90vw] max-h-[90vh] object-contain" />
</div>
}
```

---

## #3. FAQ 아코디언 expand/collapse (shop)

### 현재 상태
`faq.page.html`: `@if (expandedId() === faq.id)` 로 내용이 즉시 나타남/사라짐.
아이콘 회전은 이미 `transition-transform duration-300`으로 처리됨.

현재 HTML (아코디언 내용 부분):
```html
@if (expandedId() === faq.id) {
<div class="px-6 pb-5 pt-0">
    <div class="border-t ...">{{ faq.answer }}</div>
</div>
}
```

### 목표
- 펼칠 때: height 0 + opacity 0 → 자연 높이 + opacity 1 (250ms, ease-out)
- 접을 때: 자연 높이 + opacity 1 → height 0 + opacity 0 (200ms, ease-in)

### 구현

**`apps/shop/src/app/pages/faq/faq.page.ts`** 수정:
```ts
import { animate, style, transition, trigger } from "@angular/animations";

@Component({
    ...
    animations: [
        trigger('accordion', [
            transition(':enter', [
                style({ height: 0, opacity: 0, overflow: 'hidden' }),
                animate('250ms ease-out', style({ height: '*', opacity: 1, overflow: 'hidden' })),
            ]),
            transition(':leave', [
                style({ overflow: 'hidden' }),
                animate('200ms ease-in', style({ height: 0, opacity: 0 })),
            ]),
        ]),
    ],
})
```

**`apps/shop/src/app/pages/faq/faq.page.html`** 수정:

아코디언 내용 div에 `@accordion` 추가:
```html
@if (expandedId() === faq.id) {
<div @accordion class="px-6 pb-5 pt-0">
    <div class="border-t border-outline-variant/30 pt-4 text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap break-words"
        [innerText]="faq.answer"></div>
</div>
}
```

---

## #4. 약관 아코디언 expand/collapse (shop)

### 현재 상태
`pre-registration-form.page.html`: `@if (expandedTermsId === term.id)` 로 내용이 즉시 나타남/사라짐.

현재 HTML (약관 내용 부분):
```html
@if (expandedTermsId === term.id) {
<div class="px-4 py-3 bg-surface-container-low border-t border-outline-variant text-xs ... max-h-40 overflow-y-auto">
    {{ term.content }}
</div>
}
```

### 목표
FAQ 아코디언과 동일한 패턴 (#3과 동일한 `accordion` trigger 사용).

### 구현

**`apps/shop/src/app/pages/pre-registration/pre-registration-form/pre-registration-form.page.ts`** 수정:
```ts
import { animate, style, transition, trigger } from "@angular/animations";

@Component({
    ...
    animations: [
        trigger('accordion', [
            transition(':enter', [
                style({ height: 0, opacity: 0, overflow: 'hidden' }),
                animate('250ms ease-out', style({ height: '*', opacity: 1, overflow: 'hidden' })),
            ]),
            transition(':leave', [
                style({ overflow: 'hidden' }),
                animate('200ms ease-in', style({ height: 0, opacity: 0 })),
            ]),
        ]),
    ],
})
```

**`pre-registration-form.page.html`** 약관 내용 div에 `@accordion` 추가:
```html
@if (expandedTermsId === term.id) {
<div @accordion
    class="px-4 py-3 bg-surface-container-low border-t border-outline-variant text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
    {{ term.content }}
</div>
}
```

---

## #5. 사전등록 완료 페이지 celebratory 입장 (shop)

### 현재 상태
`pre-registration-complete.page.html`: 체크 아이콘과 텍스트가 즉시 나타남.

현재 HTML:
```html
<div class="flex flex-col items-center justify-center min-h-[400px] text-center">
    <div class="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
        <span class="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
    </div>
    <h1 class="text-3xl font-extrabold text-slate-900 mb-3">사전 등록 완료</h1>
    <p class="text-slate-500 text-lg mb-2">사전 등록이 정상적으로 완료되었습니다.</p>
    <p class="text-slate-400 text-sm mb-10">입력하신 연락처로 안내사항을 전달드릴 예정입니다.</p>
    <div class="flex gap-4">...</div>
</div>
```

### 목표
- 체크 아이콘 배경: scale(0) → scale(1), bounce easing (400ms)
- 제목: opacity 0 + translateY(12px) → opacity 1 + translateY(0), delay 300ms
- 부제목: 동일, delay 450ms
- 설명: 동일, delay 550ms
- 버튼: 동일, delay 650ms

### 구현

**`apps/shop/src/styles.css`** 에 커스텀 keyframe 추가:
```css
@keyframes scale-bounce-in {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.15); opacity: 1; }
    80% { transform: scale(0.95); }
    100% { transform: scale(1); }
}
@keyframes fade-in-up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-scale-bounce-in {
    animation: scale-bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.animate-fade-in-up {
    animation: fade-in-up 0.4s ease-out forwards;
    opacity: 0;
}
```

**`pre-registration-complete.page.html`** 수정:
```html
<div class="flex flex-col items-center justify-center min-h-[400px] text-center">
    <div class="animate-scale-bounce-in w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
        <span class="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
    </div>
    <h1 class="animate-fade-in-up text-3xl font-extrabold text-slate-900 mb-3"
        style="animation-delay: 300ms">사전 등록 완료</h1>
    <p class="animate-fade-in-up text-slate-500 text-lg mb-2"
        style="animation-delay: 450ms">사전 등록이 정상적으로 완료되었습니다.</p>
    <p class="animate-fade-in-up text-slate-400 text-sm mb-10"
        style="animation-delay: 550ms">입력하신 연락처로 안내사항을 전달드릴 예정입니다.</p>
    <div class="animate-fade-in-up flex gap-4" style="animation-delay: 650ms">
        ...버튼들...
    </div>
</div>
```

---

## #6. Empty State 등장 애니메이션 (admin + shop)

### 현재 상태
두 앱의 `empty-state.component.html`이 즉시 렌더링됨.

**Admin** HTML:
```html
<div class="flex flex-col items-center justify-center py-16 text-on-surface-variant text-center">
    <span class="material-symbols-outlined text-[48px] text-outline-variant mb-3 opacity-40">{{ icon() }}</span>
    <p class="text-base font-semibold mb-1">{{ title() }}</p>
    ...
</div>
```

**Shop** HTML:
```html
<div class="text-center py-20">
  <span class="material-symbols-outlined text-outline text-[48px] mb-4">{{ icon() }}</span>
  <p class="text-on-surface-variant">{{ message() }}</p>
</div>
```

### 목표
- 아이콘: scale(0.8) + opacity 0 → scale(1) + opacity 1 (300ms)
- 텍스트: opacity 0 → opacity 1, delay 100ms

### 구현

**`apps/admin/src/styles.css`** 에 추가 (shop도 동일하게):
```css
@keyframes fade-in-up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in-scale {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
}
.animate-fade-in-up {
    animation: fade-in-up 0.4s ease-out forwards;
    opacity: 0;
}
.animate-fade-in-scale {
    animation: fade-in-scale 0.3s ease-out forwards;
    opacity: 0;
}
```

**`apps/admin/src/app/components/empty-state/empty-state.component.html`** 수정:
```html
<div class="flex flex-col items-center justify-center py-16 text-on-surface-variant text-center">
    <span class="animate-fade-in-scale material-symbols-outlined text-[48px] text-outline-variant mb-3 opacity-40">
        {{ icon() }}
    </span>
    <p class="animate-fade-in-up text-base font-semibold mb-1" style="animation-delay: 100ms">{{ title() }}</p>
    @if (description()) {
    <p class="animate-fade-in-up text-sm opacity-70 mb-6" style="animation-delay: 180ms">{{ description() }}</p>
    }
    @if (actionLabel()) {
    <div class="animate-fade-in-up" style="animation-delay: 250ms">
        <app-button variant="primary" [label]="actionLabel()!" (action)="onAction()" />
    </div>
    }
</div>
```

**`apps/shop/src/app/components/empty-state/empty-state.component.html`** 수정:
```html
<div class="text-center py-20">
  <span class="animate-fade-in-scale material-symbols-outlined text-outline text-[48px] mb-4 block">
      {{ icon() }}
  </span>
  <p class="animate-fade-in-up text-on-surface-variant" style="animation-delay: 100ms">{{ message() }}</p>
  <ng-content />
</div>
```

### 주의사항
- `styles.css` 에 keyframe은 한 번만 추가 (중복 주의)
- `opacity: 0` 초기값을 CSS class 안에 포함시켜야 깜빡임 없음

---

## #7. 홈 히어로 섹션 텍스트 순차 등장 (shop)

### 현재 상태
`home.page.html` 히어로 섹션의 텍스트/버튼들이 즉시 렌더링됨.

현재 HTML (히어로 내부):
```html
<div class="relative z-20 text-center px-5 max-w-[900px] mx-auto py-20">
    <p class="text-sm font-semibold uppercase tracking-[0.2em] mb-2 opacity-90">WELCOME TO DEMO</p>
    <h1 class="text-5xl md:text-[64px] font-extrabold leading-tight mb-8 tracking-tight">다가오는 행사를 만나보세요</h1>
    <p class="text-lg mb-8 opacity-80 max-w-[600px] mx-auto leading-relaxed">최신 행사 정보부터...</p>
    <div class="flex flex-col md:flex-row gap-4 justify-center">버튼들</div>
</div>
```

### 목표
- WELCOME 소제목: delay 0ms
- H1 제목: delay 150ms
- 설명 텍스트: delay 300ms
- 버튼 그룹: delay 450ms

### 구현

`#6` 에서 `animate-fade-in-up` keyframe이 이미 추가되었다면 추가 불필요.

**`home.page.html`** 히어로 내부 수정:
```html
<div class="relative z-20 text-center px-5 max-w-[900px] mx-auto py-20">
    <p class="animate-fade-in-up text-sm font-semibold uppercase tracking-[0.2em] mb-2 opacity-90"
        style="animation-delay: 0ms">WELCOME TO DEMO</p>
    <h1 class="animate-fade-in-up text-5xl md:text-[64px] font-extrabold leading-tight mb-8 tracking-tight"
        style="animation-delay: 150ms">다가오는 행사를 만나보세요</h1>
    <p class="animate-fade-in-up text-lg mb-8 opacity-80 max-w-[600px] mx-auto leading-relaxed"
        style="animation-delay: 300ms">최신 행사 정보부터 갤러리까지, 한곳에서 확인하세요. 당신을 위한 특별한 경험이 기다리고 있습니다.</p>
    <div class="animate-fade-in-up flex flex-col md:flex-row gap-4 justify-center"
        style="animation-delay: 450ms">
        ...버튼들...
    </div>
</div>
```

### 주의사항
- 히어로 배경의 `opacity-90`, `opacity-80` 은 기존 class이므로 `animate-fade-in-up` 의 `opacity: 0` 초기값과 충돌 가능
- 애니메이션이 끝난 후 최종 opacity는 각 요소의 기존 opacity class 값이 아닌 `1` 이 됨
- 필요시 `animation-fill-mode: forwards` 확인 (CSS에 이미 포함됨)
- 히어로 내 텍스트들의 `opacity-90`, `opacity-80` 은 그 위에 `rgba` 나 CSS opacity로 처리되므로 실제로는 충돌 없음 (Tailwind opacity는 `--tw-text-opacity` 변수)

---

## #8. Data Table 행 staggered 등장 (admin)

### 현재 상태
`data-table.component.html`: `@for` 로 tbody 행이 한꺼번에 즉시 렌더링됨.

### 목표
- 각 행이 순차적으로 (30ms 간격) fade-in-up으로 등장

### 구현

`#6` 에서 `animate-fade-in-up` keyframe이 이미 추가되었다면 추가 불필요.

**`apps/admin/src/app/components/data-table/data-table.component.html`** tbody의 `<tr>` 수정:

```html
@for (item of items(); track item.id; let i = $index) {
<tr (click)="onRowClick(item)"
    class="animate-fade-in-up hover:bg-surface-container-low transition-colors cursor-pointer"
    [style.animation-delay]="i * 30 + 'ms'"
    ...>
    ...
</tr>
}
```

### 주의사항
- 항목이 많을 때 (50개+) stagger delay가 1500ms 이상 걸림 → delay 최대값 상한 설정
- 상한 처리 방법: `[style.animation-delay]="Math.min(i * 30, 300) + 'ms'"` 하지만 template에서 `Math` 사용 불가
- 대신 컴포넌트 TS에 헬퍼 추가:
  ```ts
  getRowDelay(i: number): string {
      return Math.min(i * 30, 300) + 'ms';
  }
  ```
  ```html
  [style.animation-delay]="getRowDelay(i)"
  ```

---

## 최종 CSS keyframe 정리

`apps/admin/src/styles.css` 와 `apps/shop/src/styles.css` 둘 다 동일하게 추가:
```css
/* ===== Custom Animations ===== */

@keyframes fade-in-up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-scale {
    from { opacity: 0; transform: scale(0.85); }
    to { opacity: 1; transform: scale(1); }
}

@keyframes scale-bounce-in {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.15); opacity: 1; }
    80% { transform: scale(0.95); }
    100% { transform: scale(1); opacity: 1; }
}

.animate-fade-in-up {
    animation: fade-in-up 0.4s ease-out forwards;
    opacity: 0;
}

.animate-fade-in-scale {
    animation: fade-in-scale 0.3s ease-out forwards;
    opacity: 0;
}

.animate-scale-bounce-in {
    animation: scale-bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

### 주의사항
- `opacity: 0` 이 초기값으로 설정되어야 페이지 로드 시 깜빡임 없음 → class 안에 포함됨
- `forwards` fill-mode 필수: 애니메이션 끝나도 최종 상태 유지
- `admin` 의 keyframe과 `shop` 의 keyframe은 각각 별도로 추가 (공유 CSS 없음)

---

## Angular animations 공통 참고

### import 방법 (매 컴포넌트 TS 파일에 추가)
```ts
import { animate, style, transition, trigger } from '@angular/animations';
```

### `@Component` 데코레이터에 추가
```ts
@Component({
    ...
    animations: [
        trigger('triggerName', [
            transition(':enter', [...]),
            transition(':leave', [...]),
        ])
    ],
})
```

### HTML 템플릿에서 사용
```html
@if (condition) {
<div @triggerName>
    ...
</div>
}
```

### height * 설명
`style({ height: '*' })` 에서 `*` 은 "요소의 자연 높이"를 의미함.
`height: 0` → `height: '*'` 로 애니메이션하면 실제 콘텐츠 높이로 부드럽게 펼쳐짐.

---

## 진행 로그

- 2026-05-21: 계획서 작성
