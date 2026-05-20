# Shop 앱 컴포넌트화 계획 문서

## 프로젝트 컨텍스트

- **프레임워크**: Angular 17+ (standalone components, signals)
- **스타일**: Tailwind CSS
- **아이콘**: Material Symbols Outlined (`<span class="material-symbols-outlined">`)
- **컴포넌트 위치**: `apps/shop/src/app/components/`
- **각 컴포넌트는 standalone**, `imports` 배열 사용 (NgModule 없음)
- **Signal API**: `input()`, `output()`, `signal()`, `computed()` 사용 (Angular 17+)

## 기존 컴포넌트 현황 (건드릴 필요 없음)

```
apps/shop/src/app/components/
├── article-view/       ← 상세 페이지 본문 레이아웃 (title, badges slot, footer slot 등)
├── back-button/        ← 목록으로 + slot=actions
├── card-grid/          ← 4열 그리드 + 빈 상태
├── content-wrapper/    ← max-width 컨테이너
├── empty-state/        ← 아이콘 + 메시지 + ng-content
├── form-actions/       ← 취소/제출 버튼 쌍
├── form-field/         ← label + required asterisk + ng-content
├── image-card/         ← aspect-ratio 이미지 + fallback + ng-content
├── loading-spinner/    ← autorenew 아이콘 + 메시지
└── tab-nav/            ← RouterLink 또는 button 기반 탭
```

공통 유틸:
- `apps/shop/src/app/shared/utils/event-status.util.ts` — `getEventStatus()`, `isPreRegistrationOpen()`, `getDday()`

---

## 1순위: `app-event-card`

### 목적
`app-image-card` 안에 들어가는 이벤트 카드 내용(상태 뱃지 + 제목 + 날짜 + 장소)이 **3곳**에서 완전히 동일하게 반복됨.

### 사용 위치 (3곳)

**event.page.html:**
```html
<app-image-card (click)="goDetail(item)" [imageUrl]="item.posterImage" fallbackIcon="event" [alt]="item.title">
  <div class="flex items-center gap-2 mb-2">
    <span class="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase" [ngClass]="getEventStatus(item).class">
      {{ getEventStatus(item).label }}
    </span>
  </div>
  <h3 class="font-bold text-lg text-slate-900 line-clamp-1 break-all group-hover:text-primary transition-colors">{{ item.title }}</h3>
  <p class="text-sm text-slate-500 mt-1">{{ item.startDate | date:'yyyy.MM.dd' }} ~ {{ item.endDate | date:'yyyy.MM.dd' }}</p>
  @if (item.location) {
  <p class="text-sm text-slate-400 mt-1 flex items-center gap-1 truncate">
    <span class="material-symbols-outlined text-sm shrink-0">location_on</span>
    <span class="truncate">{{ item.location }}</span>
  </p>
  }
</app-image-card>
```

**home.page.html:** 동일 구조 (변수명 `event`, 약간 다른 글자색 `text-on-surface` vs `text-slate-900`)

**pre-registration.page.html:** 상태 뱃지만 D-day 뱃지로 다름 (`getDday()` + `bg-violet-100 text-violet-700`), 나머지 동일

### 생성할 파일
- `apps/shop/src/app/components/event-card/event-card.component.ts`
- `apps/shop/src/app/components/event-card/event-card.component.html`

### 컴포넌트 구현

**event-card.component.ts:**
```ts
import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventDto } from '@api-client-shop';
import { ImageCardComponent } from '../image-card/image-card.component';
import { getEventStatus } from '../../shared/utils/event-status.util';

export type EventCardBadgeMode = 'status' | 'dday';

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  imports: [CommonModule, ImageCardComponent],
})
export class EventCardComponent {
  event = input.required<EventDto>();
  badgeMode = input<EventCardBadgeMode>('status');
  fallbackIcon = input<string>('event');

  cardClick = output<EventDto>();

  badge = computed(() => {
    const e = this.event();
    if (this.badgeMode() === 'dday' && e.preRegEndDate) {
      const end = new Date(e.preRegEndDate);
      const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return { label: diff <= 0 ? '마감' : `D-${diff}`, class: 'bg-violet-100 text-violet-700' };
    }
    return getEventStatus(e);
  });

  onClick(): void {
    this.cardClick.emit(this.event());
  }
}
```

**event-card.component.html:**
```html
<app-image-card (click)="onClick()" [imageUrl]="event().posterImage" [fallbackIcon]="fallbackIcon()" [alt]="event().title">
  <div class="flex items-center gap-2 mb-2">
    <span class="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase" [ngClass]="badge().class">
      {{ badge().label }}
    </span>
  </div>
  <h3 class="font-bold text-lg text-on-surface line-clamp-1 break-all group-hover:text-primary transition-colors">
    {{ event().title }}
  </h3>
  <p class="text-sm text-on-surface-variant mt-1">
    {{ event().startDate | date:'yyyy.MM.dd' }} ~ {{ event().endDate | date:'yyyy.MM.dd' }}
  </p>
  @if (event().location) {
  <p class="text-sm text-on-surface-variant/70 mt-1 flex items-center gap-1 truncate">
    <span class="material-symbols-outlined text-sm shrink-0">location_on</span>
    <span class="truncate">{{ event().location }}</span>
  </p>
  }
</app-image-card>
```

### 적용 후 사용 예시

**event.page.html:**
```html
<app-card-grid [isEmpty]="events().length === 0" emptyIcon="event_busy" emptyMessage="등록된 행사가 없습니다.">
  @for (item of events(); track item.id) {
    <app-event-card [event]="item" (cardClick)="goDetail($event)" />
  }
</app-card-grid>
```

**home.page.html:**
```html
@for (event of events(); track event.id) {
  <app-event-card [event]="event" (cardClick)="goEventDetail($event)" />
}
```

**pre-registration.page.html:**
```html
@for (item of events(); track item.id) {
  <app-event-card [event]="item" badgeMode="dday" fallbackIcon="how_to_reg" (cardClick)="selectEvent($event)" />
}
```

### 주의사항
- pre-registration은 `badgeMode="dday"` + 사전등록 마감일을 추가로 표시 → `ng-content` 또는 별도 `showPreRegDeadline` input으로 처리 가능
- `host: { 'style': 'display: contents' }` 불필요 (image-card가 block 요소)

---

## 2순위: `app-event-status-badge`

### 목적
이벤트 상태 뱃지 (`getEventStatus()` 결과 기반). event.page, event-detail, home.page 동일 span 반복.

### 사용 위치 (3곳)
- `event.page.html` — 카드 내 뱃지
- `event-detail.page.html` — article-view badges slot
- `home.page.html` — 이벤트 하이라이트 카드 내 뱃지

### 현재 반복 패턴
```html
<span class="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase" [ngClass]="getEventStatus(item).class">
  {{ getEventStatus(item).label }}
</span>

<!-- event-detail: 약간 다른 padding -->
<span class="px-2.5 py-1 text-xs font-bold tracking-wider uppercase" [ngClass]="getEventStatus(event).class">
  {{ getEventStatus(event).label }}
</span>
```

### 생성할 파일
- `apps/shop/src/app/components/event-status-badge/event-status-badge.component.ts`
- `apps/shop/src/app/components/event-status-badge/event-status-badge.component.html`

### 컴포넌트 구현

**event-status-badge.component.ts:**
```ts
import { Component, computed, input } from '@angular/core';
import { EventDto } from '@api-client-shop';
import { getEventStatus } from '../../shared/utils/event-status.util';

export type EventStatusBadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-event-status-badge',
  templateUrl: './event-status-badge.component.html',
})
export class EventStatusBadgeComponent {
  event = input.required<EventDto>();
  size = input<EventStatusBadgeSize>('sm');

  badge = computed(() => getEventStatus(this.event()));

  sizeClass = computed(() =>
    this.size() === 'md'
      ? 'px-2.5 py-1 text-xs'
      : 'px-2 py-0.5 text-[10px]'
  );
}
```

**event-status-badge.component.html:**
```html
<span class="font-bold tracking-wider uppercase" [class]="sizeClass()" [ngClass]="badge().class">
  {{ badge().label }}
</span>
```

### 적용 후 사용 예시

```html
<!-- event.page (sm - 기본) -->
<app-event-status-badge [event]="item" />

<!-- event-detail (md) -->
<app-event-status-badge slot="badges" [event]="event" size="md" />
```

### 주의사항
- `event-card` 내부에서도 이 컴포넌트를 재사용하면 더 일관성 있음
- inquiry 상태 뱃지(`getStatusStyle()`)는 별도 스타일 함수를 사용하므로 이 컴포넌트와 무관

---

## 3순위: `app-meta-info-row`

### 목적
event-detail의 `slot="header-extra"` 내 icon + 라벨 + 값 한 줄 패턴. **5개**가 동일한 div 구조로 반복됨.

### 사용 위치 (1곳, 내부 5회 반복)

**event-detail.page.html:**
```html
<div slot="header-extra" class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600 items-start mt-6">
  <div class="flex items-center gap-2">
    <span class="material-symbols-outlined text-base text-slate-400">calendar_today</span>
    <span class="font-medium">행사 기간</span>
    <span class="text-slate-500">{{ event.startDate | date:'yyyy.MM.dd' }} ~ {{ event.endDate | date:'yyyy.MM.dd' }}</span>
  </div>
  <div class="flex items-center gap-2">
    <span class="material-symbols-outlined text-base text-slate-400">schedule</span>
    <span class="font-medium">운영 시간</span>
    <span class="text-slate-500">{{ event.operatingStartTime }} ~ {{ event.operatingEndTime }}</span>
  </div>
  @if (event.location) {
  <div class="flex items-start gap-2">
    <span class="material-symbols-outlined text-base text-slate-400 shrink-0 mt-0.5">location_on</span>
    <span class="font-medium shrink-0">장소</span>
    <span class="text-slate-500 break-all">{{ event.location }}</span>
  </div>
  }
  <!-- ... 등 5개 반복 -->
</div>
```

### 생성할 파일
- `apps/shop/src/app/components/meta-info-row/meta-info-row.component.ts`
- `apps/shop/src/app/components/meta-info-row/meta-info-row.component.html`

### 컴포넌트 구현

**meta-info-row.component.ts:**
```ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-meta-info-row',
  templateUrl: './meta-info-row.component.html',
  host: { 'class': 'flex items-start gap-2' },
})
export class MetaInfoRowComponent {
  icon = input.required<string>();
  label = input.required<string>();
}
```

**meta-info-row.component.html:**
```html
<span class="material-symbols-outlined text-base text-slate-400 shrink-0 mt-0.5">{{ icon() }}</span>
<span class="font-medium shrink-0 text-slate-600">{{ label() }}</span>
<span class="text-slate-500 break-all"><ng-content /></span>
```

### 적용 후 사용 예시

```html
<div slot="header-extra" class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm items-start mt-6">
  <app-meta-info-row icon="calendar_today" label="행사 기간">
    {{ event.startDate | date:'yyyy.MM.dd' }} ~ {{ event.endDate | date:'yyyy.MM.dd' }}
  </app-meta-info-row>
  <app-meta-info-row icon="schedule" label="운영 시간">
    {{ event.operatingStartTime }} ~ {{ event.operatingEndTime }}
  </app-meta-info-row>
  @if (event.location) {
  <app-meta-info-row icon="location_on" label="장소">{{ event.location }}</app-meta-info-row>
  }
  @if (event.contactNumber) {
  <app-meta-info-row icon="call" label="문의">{{ event.contactNumber }}</app-meta-info-row>
  }
  @if (event.preRegStartDate && event.preRegEndDate) {
  <app-meta-info-row icon="how_to_reg" label="사전등록">
    {{ event.preRegStartDate | date:'yyyy.MM.dd' }} ~ {{ event.preRegEndDate | date:'yyyy.MM.dd' }}
  </app-meta-info-row>
  }
</div>
```

---

## 4순위: `app-inquiry-answer`

### 목적
inquiry-detail의 관리자 답변 영역. 답변 있음/없음 두 상태를 독립 컴포넌트로 분리.

### 사용 위치 (1곳)

**inquiry-detail.page.html** — `slot="footer"` 영역:
```html
<!-- 답변 있음 -->
@if (inquiry.answer) {
<div slot="footer" class="mx-8 mb-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 overflow-hidden">
  <div class="px-6 py-4 border-b border-primary/15 flex items-center gap-2">
    <span class="material-symbols-outlined text-primary text-lg">support_agent</span>
    <span class="font-semibold text-primary text-sm">관리자 답변</span>
    @if (inquiry.answeredAt) {
    <span class="text-xs text-slate-500 ml-auto">{{ inquiry.answeredAt | date:'yyyy.MM.dd HH:mm' }}</span>
    }
  </div>
  <div class="px-6 py-5 text-slate-700 leading-relaxed whitespace-pre-wrap text-sm break-words">
    {{ inquiry.answer }}
  </div>
</div>
} @else {
<!-- 답변 없음 -->
<div slot="footer" class="mx-8 mb-8 bg-slate-50 rounded-xl border border-slate-200 px-6 py-8 text-center">
  <span class="material-symbols-outlined text-slate-300 text-[40px] mb-3">hourglass_top</span>
  <p class="text-slate-500 text-sm font-medium">아직 답변이 등록되지 않았습니다.</p>
  <p class="text-slate-400 text-xs mt-1">빠른 시일 내에 답변드리겠습니다.</p>
</div>
}
```

### 생성할 파일
- `apps/shop/src/app/components/inquiry-answer/inquiry-answer.component.ts`
- `apps/shop/src/app/components/inquiry-answer/inquiry-answer.component.html`

### 컴포넌트 구현

**inquiry-answer.component.ts:**
```ts
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inquiry-answer',
  templateUrl: './inquiry-answer.component.html',
  imports: [CommonModule],
})
export class InquiryAnswerComponent {
  answer = input<string | null>(null);
  answeredAt = input<string | null>(null);
}
```

**inquiry-answer.component.html:**
```html
@if (answer()) {
<div class="mx-8 mb-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 overflow-hidden">
  <div class="px-6 py-4 border-b border-primary/15 flex items-center gap-2">
    <span class="material-symbols-outlined text-primary text-lg">support_agent</span>
    <span class="font-semibold text-primary text-sm">관리자 답변</span>
    @if (answeredAt()) {
    <span class="text-xs text-slate-500 ml-auto">{{ answeredAt() | date:'yyyy.MM.dd HH:mm' }}</span>
    }
  </div>
  <div class="px-6 py-5 text-slate-700 leading-relaxed whitespace-pre-wrap text-sm break-words">
    {{ answer() }}
  </div>
</div>
} @else {
<div class="mx-8 mb-8 bg-slate-50 rounded-xl border border-slate-200 px-6 py-8 text-center">
  <span class="material-symbols-outlined text-slate-300 text-[40px] mb-3">hourglass_top</span>
  <p class="text-slate-500 text-sm font-medium">아직 답변이 등록되지 않았습니다.</p>
  <p class="text-slate-400 text-xs mt-1">빠른 시일 내에 답변드리겠습니다.</p>
</div>
}
```

### 적용 후 사용 예시

```html
<app-inquiry-answer
  slot="footer"
  [answer]="inquiry.answer ?? null"
  [answeredAt]="inquiry.answeredAt ?? null" />
```

---

## 5순위: `app-faq-item`

### 목적
FAQ 아코디언 한 항목. faq.page의 반복 div를 컴포넌트로 분리.

### 사용 위치 (1곳, 내부 반복)

**faq.page.html:**
```html
<div class="border border-outline-variant/30 rounded-xl overflow-hidden transition-all"
    [class.border-primary/30]="expandedId() === faq.id">
  <button (click)="toggle(faq.id)"
      class="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer hover:bg-surface-container-low/50 transition-colors">
    <span class="text-sm font-semibold text-on-surface pr-4">{{ faq.question }}</span>
    <span class="material-symbols-outlined text-on-surface-variant shrink-0 transition-transform duration-300"
        [class.rotate-180]="expandedId() === faq.id">
      expand_more
    </span>
  </button>
  @if (expandedId() === faq.id) {
  <div class="px-6 pb-5 pt-0">
    <div class="border-t border-outline-variant/30 pt-4 text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap break-words">
      {{ faq.answer }}
    </div>
  </div>
  }
</div>
```

### 생성할 파일
- `apps/shop/src/app/components/faq-item/faq-item.component.ts`
- `apps/shop/src/app/components/faq-item/faq-item.component.html`

### 컴포넌트 구현

**faq-item.component.ts:**
```ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-faq-item',
  templateUrl: './faq-item.component.html',
})
export class FaqItemComponent {
  question = input.required<string>();
  answer = input.required<string>();
  expanded = input<boolean>(false);

  toggle = output<void>();
}
```

**faq-item.component.html:**
```html
<div class="border border-outline-variant/30 rounded-xl overflow-hidden transition-all"
    [class.border-primary/30]="expanded()">
  <button (click)="toggle.emit()"
      class="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer hover:bg-surface-container-low/50 transition-colors">
    <span class="text-sm font-semibold text-on-surface pr-4">{{ question() }}</span>
    <span class="material-symbols-outlined text-on-surface-variant shrink-0 transition-transform duration-300"
        [class.rotate-180]="expanded()">
      expand_more
    </span>
  </button>
  @if (expanded()) {
  <div class="px-6 pb-5 pt-0">
    <div class="border-t border-outline-variant/30 pt-4 text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap break-words">
      {{ answer() }}
    </div>
  </div>
  }
</div>
```

### 적용 후 사용 예시

```html
<!-- faq.page.ts에 expandedId = signal<string | null>(null) 유지 -->
<div class="space-y-3">
  @for (faq of faqs(); track faq.id) {
    <app-faq-item
      [question]="faq.question"
      [answer]="faq.answer"
      [expanded]="expandedId() === faq.id"
      (toggle)="toggle(faq.id)" />
  } @empty {
    <app-empty-state icon="help_outline" message="등록된 자주 묻는 질문이 없습니다." />
  }
</div>
```

---

## 작업 순서 요약

| 순서 | 컴포넌트 셀렉터 | 파일 경로 | 적용 페이지 수 |
|------|--------------|-----------|------------|
| 1 | `app-event-card` | `components/event-card/` | 3 (event, home, pre-registration) |
| 2 | `app-event-status-badge` | `components/event-status-badge/` | 3 (event, event-detail, home) |
| 3 | `app-meta-info-row` | `components/meta-info-row/` | 1 (event-detail, 내부 5회) |
| 4 | `app-inquiry-answer` | `components/inquiry-answer/` | 1 (inquiry-detail) |
| 5 | `app-faq-item` | `components/faq-item/` | 1 (faq.page, 내부 반복) |

모든 경로는 `apps/shop/src/app/` 기준.

## 각 컴포넌트 작업 체크리스트

각 컴포넌트마다:
1. `apps/shop/src/app/components/{name}/` 폴더 생성
2. `.component.ts` 파일 작성 (위 설계 참고)
3. `.component.html` 파일 작성 (위 설계 참고)
4. 각 적용 대상 페이지 HTML에서 기존 반복 코드 → 컴포넌트 태그로 교체
5. 각 적용 대상 페이지 TS의 `@Component` `imports` 배열에 새 컴포넌트 추가

## 참고: 기존 컴포넌트 구조

```
apps/shop/src/app/components/
├── article-view/
├── back-button/
├── card-grid/
├── content-wrapper/
├── empty-state/
├── form-actions/
├── form-field/
├── image-card/
├── loading-spinner/
└── tab-nav/
```
