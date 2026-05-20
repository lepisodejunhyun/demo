# Admin 앱 컴포넌트화 계획 문서

## 프로젝트 컨텍스트

- **프레임워크**: Angular 17+ (standalone components, signals)
- **스타일**: Tailwind CSS
- **아이콘**: Material Symbols Outlined (`<span class="material-symbols-outlined">`)
- **컴포넌트 위치**: `apps/admin/src/app/components/`
- **각 컴포넌트는 standalone**, `imports` 배열 사용 (NgModule 없음)
- **Signal API**: `input()`, `output()`, `signal()`, `computed()` 사용 (Angular 17+)
- **변경감지**: `ChangeDetectionStrategy.OnPush` 적용

## 기존 컴포넌트 패턴 참고

```ts
// 가장 간단한 컴포넌트 패턴 (form-field 기준)
import { Component, input } from "@angular/core";

@Component({
    selector: 'app-xxx',
    templateUrl: './xxx.component.html',
    host: { 'style': 'display: block' }, // 필요시
})
export class XxxComponent {
    someInput = input.required<string>();
    optionalInput = input<boolean>(false);
}
```

---

## 1순위: `app-detail-actions`

### 목적
수정/삭제 버튼 쌍을 컴포넌트화. 모든 detail 페이지의 `page-header` `slot="actions"` 영역에서 반복됨.

### 사용 위치 (7곳)
- `apps/admin/src/app/pages/event/event-detail/event-detail.page.html` — 수정 + 삭제
- `apps/admin/src/app/pages/notice/notice-detail/notice-detail.page.html` — 수정 + 삭제
- `apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.html` — 수정 + 삭제
- `apps/admin/src/app/pages/gallery/gallery-detail/gallery-detail.page.html` — 수정 + 삭제
- `apps/admin/src/app/pages/terms/terms-detail/terms-detail.page.html` — 수정 + 삭제
- `apps/admin/src/app/pages/pre-registration/pre-registration-detail/pre-registration-detail.page.html` — 수정 + 삭제
- `apps/admin/src/app/pages/inquiry/inquiry-detail/inquiry-detail.page.html` — **삭제만** (수정 버튼 없음)

### 현재 반복되는 HTML (event-detail 기준)
```html
<a slot="actions" [routerLink]="'/event/' + event()!.id + '/edit'"
    class="px-4 py-2 text-primary font-semibold text-xs rounded hover:bg-surface-container-low transition-colors flex items-center gap-1 cursor-pointer">
    <span class="material-symbols-outlined text-[18px]">edit</span>
    수정
</a>
<button slot="actions" (click)="onDelete()"
    class="px-4 py-2 text-error font-semibold text-xs border border-transparent rounded hover:bg-error-container/20 transition-colors flex items-center gap-1 cursor-pointer">
    <span class="material-symbols-outlined text-[18px]">delete</span>
    삭제
</button>
```

inquiry-detail (삭제만):
```html
<button slot="actions" (click)="onDelete()"
    class="px-4 py-2 text-error font-semibold text-xs border border-transparent rounded hover:bg-error-container/20 transition-colors flex items-center gap-1 cursor-pointer">
    <span class="material-symbols-outlined text-[18px]">delete</span>
    삭제
</button>
```

### 생성할 파일
- `apps/admin/src/app/components/detail-actions/detail-actions.component.ts`
- `apps/admin/src/app/components/detail-actions/detail-actions.component.html`

### 컴포넌트 구현

**detail-actions.component.ts:**
```ts
import { Component, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'app-detail-actions',
    templateUrl: './detail-actions.component.html',
    imports: [CommonModule, RouterLink],
})
export class DetailActionsComponent {
    editLink = input<string | null>(null);  // null이면 수정 버튼 숨김
    delete = output<void>();

    onDelete(): void {
        this.delete.emit();
    }
}
```

**detail-actions.component.html:**
```html
@if (editLink()) {
<a [routerLink]="editLink()"
    class="px-4 py-2 text-primary font-semibold text-xs rounded hover:bg-surface-container-low transition-colors flex items-center gap-1 cursor-pointer">
    <span class="material-symbols-outlined text-[18px]">edit</span>
    수정
</a>
}
<button type="button" (click)="onDelete()"
    class="px-4 py-2 text-error font-semibold text-xs border border-transparent rounded hover:bg-error-container/20 transition-colors flex items-center gap-1 cursor-pointer">
    <span class="material-symbols-outlined text-[18px]">delete</span>
    삭제
</button>
```

### 적용 후 사용 예시

event-detail (수정 + 삭제):
```html
<app-detail-actions
    slot="actions"
    [editLink]="'/event/' + event()!.id + '/edit'"
    (delete)="onDelete()" />
```

inquiry-detail (삭제만):
```html
<app-detail-actions
    slot="actions"
    (delete)="onDelete()" />
```

### 각 페이지 TS imports에 추가
```ts
import { DetailActionsComponent } from "../../../components/detail-actions/detail-actions.component";
// @Component imports 배열에 DetailActionsComponent 추가
```

---

## 2순위: `app-detail-field`

### 목적
detail 페이지에서 라벨+값 쌍을 표시하는 행. `grid-cols-[140px_1fr]` 그리드 안에서 반복됨.

### 사용 위치 (6곳)
- `apps/admin/src/app/pages/event/event-detail/event-detail.page.html`
- `apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.html`
- `apps/admin/src/app/pages/notice/notice-detail/notice-detail.page.html`
- `apps/admin/src/app/pages/pre-registration/pre-registration-detail/pre-registration-detail.page.html`
- `apps/admin/src/app/pages/inquiry/inquiry-detail/inquiry-detail.page.html`
- `apps/admin/src/app/pages/business-info/business-info.page.html`

### 현재 반복되는 HTML (event-detail 기준)
```html
<div class="grid grid-cols-[140px_1fr] gap-y-6 text-base content-start flex-1">
    <span class="font-semibold text-on-surface-variant">행사 기간</span>
    <span>{{ event()!.startDate | date:'yyyy.MM.dd' }} ~ {{ event()!.endDate | date:'yyyy.MM.dd' }}</span>

    <span class="font-semibold text-on-surface-variant">운영 시간</span>
    <span>{{ event()!.operatingStartTime }} ~ {{ event()!.operatingEndTime }}</span>

    <span class="font-semibold text-on-surface-variant">행사 장소</span>
    <span>{{ event()!.location || '-' }}</span>
</div>
```

### 생성할 파일
- `apps/admin/src/app/components/detail-field/detail-field.component.ts`
- `apps/admin/src/app/components/detail-field/detail-field.component.html`

### 컴포넌트 구현

**detail-field.component.ts:**
```ts
import { Component, input } from "@angular/core";

@Component({
    selector: 'app-detail-field',
    templateUrl: './detail-field.component.html',
    host: { 'style': 'display: contents' },  // 중요: 그리드 레이아웃 유지
})
export class DetailFieldComponent {
    label = input.required<string>();
}
```

**detail-field.component.html:**
```html
<span class="font-semibold text-on-surface-variant">{{ label() }}</span>
<span><ng-content /></span>
```

### 적용 후 사용 예시 (event-detail)
```html
<div class="grid grid-cols-[140px_1fr] gap-y-6 text-base content-start flex-1">
    <app-detail-field label="행사 기간">
        {{ event()!.startDate | date:'yyyy.MM.dd' }} ~ {{ event()!.endDate | date:'yyyy.MM.dd' }}
    </app-detail-field>
    <app-detail-field label="운영 시간">
        {{ event()!.operatingStartTime }} ~ {{ event()!.operatingEndTime }}
    </app-detail-field>
    <app-detail-field label="행사 장소">
        {{ event()!.location || '-' }}
    </app-detail-field>
</div>
```

### 주의사항
- `host: { 'style': 'display: contents' }` 가 필수. 없으면 컴포넌트 호스트 요소가 그리드 셀을 차지해서 2열 레이아웃이 깨짐.
- `ng-content`로 값 부분을 슬롯화해서 날짜 포맷, 파이프, 조건부 렌더링 등 유연하게 사용 가능.

---

## 3순위: `app-status-badge`

### 목적
다양한 상태/조건을 뱃지로 표시. 약관 필수/선택, 문의 답변완료/대기 등 여러 변형이 있음.

### 사용 위치 (5곳)
- `apps/admin/src/app/pages/terms/terms-detail/terms-detail.page.html` — 필수/선택 약관 (아이콘 포함)
- `apps/admin/src/app/pages/pre-registration/pre-registration-detail/pre-registration-detail.page.html` — 필수/선택 (약관 목록 내 작은 뱃지)
- `apps/admin/src/app/pages/pre-registration/pre-registration-form/pre-registration-form.page.html` — 필수/선택 (약관 목록 내)
- `apps/admin/src/app/pages/inquiry/inquiry-detail/inquiry-detail.page.html` — 답변완료/답변대기
- `apps/admin/src/app/pages/terms/terms-form/terms-form.page.html` 내 약관 목록

### 현재 반복되는 HTML 패턴들

**terms-detail (아이콘 + 큰 뱃지):**
```html
@if (terms()!.isRequired) {
<span class="inline-flex items-center gap-1 text-xs font-bold text-error bg-error/10 px-2.5 py-1 rounded">
    <span class="material-symbols-outlined text-sm">lock</span>필수 약관
</span>
} @else {
<span class="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded">
    <span class="material-symbols-outlined text-sm">lock_open</span>선택 약관
</span>
}
```

**pre-registration 약관 목록 (작은 인라인 뱃지):**
```html
@if (terms.isRequired) {
<span class="text-[10px] font-bold text-error bg-error/10 px-1.5 py-0.5 rounded">필수</span>
} @else {
<span class="text-[10px] font-bold text-on-surface-variant bg-surface-container-low px-1.5 py-0.5 rounded">선택</span>
}
```

**inquiry-detail (답변 상태):**
```html
@if (inquiry()!.status === 'COMPLETED') {
<span class="px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">답변 완료</span>
} @else {
<span class="px-2.5 py-0.5 text-xs font-medium rounded-full bg-outline/10 text-outline">답변 대기</span>
}
```

### 생성할 파일
- `apps/admin/src/app/components/status-badge/status-badge.component.ts`
- `apps/admin/src/app/components/status-badge/status-badge.component.html`

### 컴포넌트 구현

**status-badge.component.ts:**
```ts
import { Component, computed, input } from "@angular/core";
import { CommonModule } from "@angular/common";

export type StatusBadgeVariant = 'error' | 'neutral' | 'primary' | 'outline';
export type StatusBadgeSize = 'sm' | 'xs';

@Component({
    selector: 'app-status-badge',
    templateUrl: './status-badge.component.html',
    imports: [CommonModule],
})
export class StatusBadgeComponent {
    label = input.required<string>();
    variant = input<StatusBadgeVariant>('neutral');
    icon = input<string | null>(null);   // Material Symbols 아이콘명 (선택)
    size = input<StatusBadgeSize>('sm'); // sm: 기본, xs: 작은 인라인 뱃지

    classes = computed(() => {
        const base = 'inline-flex items-center gap-1 font-bold rounded';
        const sizeClass = this.size() === 'xs'
            ? 'text-[10px] px-1.5 py-0.5'
            : 'text-xs px-2.5 py-1';
        const variantClass: Record<StatusBadgeVariant, string> = {
            error: 'text-error bg-error/10',
            neutral: 'text-on-surface-variant bg-surface-container-low',
            primary: 'text-primary bg-primary/10',
            outline: 'text-outline bg-outline/10',
        };
        return `${base} ${sizeClass} ${variantClass[this.variant()]}`;
    });
}
```

**status-badge.component.html:**
```html
<span [class]="classes()">
    @if (icon()) {
    <span class="material-symbols-outlined text-sm">{{ icon() }}</span>
    }
    {{ label() }}
</span>
```

### 적용 후 사용 예시

terms-detail (필수/선택):
```html
<app-status-badge
    [label]="terms()!.isRequired ? '필수 약관' : '선택 약관'"
    [variant]="terms()!.isRequired ? 'error' : 'neutral'"
    [icon]="terms()!.isRequired ? 'lock' : 'lock_open'" />
```

pre-registration 약관 목록 (작은 뱃지):
```html
<app-status-badge
    [label]="term.isRequired ? '필수' : '선택'"
    [variant]="term.isRequired ? 'error' : 'neutral'"
    size="xs" />
```

inquiry-detail (답변 상태):
```html
<app-status-badge
    [label]="inquiry()!.status === 'COMPLETED' ? '답변 완료' : '답변 대기'"
    [variant]="inquiry()!.status === 'COMPLETED' ? 'primary' : 'outline'" />
```

---

## 4순위: `app-empty-state`

### 목적
데이터가 없을 때 표시하는 빈 상태 UI. icon + 제목 + 선택적 설명 + 선택적 액션 버튼 조합.

### 사용 위치 (3곳)
- `apps/admin/src/app/pages/gallery/gallery-detail/gallery-detail.page.html` — 이미지 없음 (버튼 없음)
- `apps/admin/src/app/pages/business-info/business-info.page.html` — 사업자 정보 없음 (버튼 있음)
- `apps/admin/src/app/components/data-table/` — 테이블 내 빈 상태 (확인 후 적용)

### 현재 반복되는 HTML

**gallery-detail (버튼 없음):**
```html
<div class="py-16 text-center text-on-surface-variant">
    <span class="material-symbols-outlined text-[48px] text-outline-variant">photo_library</span>
    <p class="text-sm mt-3">등록된 이미지가 없습니다.</p>
</div>
```

**business-info (버튼 있음):**
```html
<div class="flex flex-col items-center justify-center py-20 text-on-surface-variant">
    <span class="material-symbols-outlined text-5xl mb-4 opacity-40">store</span>
    <p class="text-base font-semibold mb-1">등록된 사업자 정보가 없습니다</p>
    <p class="text-sm opacity-70 mb-6">아래 버튼을 눌러 사업자 정보를 등록해 주세요.</p>
    <button (click)="startEdit()"
        class="bg-primary-container text-white px-6 py-2.5 rounded font-semibold text-xs hover:bg-primary transition-colors cursor-pointer">
        등록
    </button>
</div>
```

### 생성할 파일
- `apps/admin/src/app/components/empty-state/empty-state.component.ts`
- `apps/admin/src/app/components/empty-state/empty-state.component.html`

### 컴포넌트 구현

**empty-state.component.ts:**
```ts
import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'app-empty-state',
    templateUrl: './empty-state.component.html',
    imports: [CommonModule],
})
export class EmptyStateComponent {
    icon = input.required<string>();
    title = input.required<string>();
    description = input<string | null>(null);
    actionLabel = input<string | null>(null);
    action = output<void>();

    onAction(): void {
        this.action.emit();
    }
}
```

**empty-state.component.html:**
```html
<div class="flex flex-col items-center justify-center py-16 text-on-surface-variant text-center">
    <span class="material-symbols-outlined text-[48px] text-outline-variant mb-3 opacity-40">{{ icon() }}</span>
    <p class="text-base font-semibold mb-1">{{ title() }}</p>
    @if (description()) {
    <p class="text-sm opacity-70 mb-6">{{ description() }}</p>
    }
    @if (actionLabel()) {
    <button type="button" (click)="onAction()"
        class="bg-primary-container text-white px-6 py-2.5 rounded font-semibold text-xs hover:bg-primary transition-colors cursor-pointer mt-4">
        {{ actionLabel() }}
    </button>
    }
</div>
```

### 적용 후 사용 예시

gallery-detail (버튼 없음):
```html
@if (!gallery()!.images || gallery()!.images.length === 0) {
<app-empty-state icon="photo_library" title="등록된 이미지가 없습니다." />
}
```

business-info (버튼 있음):
```html
<app-empty-state
    icon="store"
    title="등록된 사업자 정보가 없습니다"
    description="아래 버튼을 눌러 사업자 정보를 등록해 주세요."
    actionLabel="등록"
    (action)="startEdit()" />
```

---

## 5순위: `app-image-upload` + `app-form-toggle`

### 5-A: `app-image-upload`

#### 목적
이미지 선택 + 미리보기 + 업로드 중 표시 UI를 컴포넌트화.

#### 사용 위치 (2곳)
- `apps/admin/src/app/pages/event/event-form/event-form.page.html` — 포스터 이미지 (단일, 세로 직사각형 w-40 h-52)
- `apps/admin/src/app/pages/gallery/gallery-form/gallery-form.page.html` — 갤러리 이미지 (다중, grid 5열)

두 곳의 구조가 달라 **단일 이미지 전용**으로 먼저 구현하고 gallery는 별도 처리 권장.

#### 현재 HTML (event-form 기준)
```html
<app-form-field label="포스터 이미지" for="event-poster">
    <div class="flex items-start gap-6">
        <div class="w-40 h-52 rounded-lg border-2 border-dashed border-outline-variant flex items-center justify-center overflow-hidden bg-surface-container shrink-0">
            @if (imagePreview()) {
            <img [src]="imagePreview()" alt="포스터 미리보기" class="w-full h-full object-cover" />
            } @else {
            <div class="text-center text-outline">
                <span class="material-symbols-outlined text-3xl">image</span>
                <p class="text-xs mt-1">미리보기</p>
            </div>
            }
        </div>
        <div class="flex flex-col gap-2">
            <label for="event-poster" class="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container-highest text-on-surface rounded font-medium text-sm cursor-pointer hover:bg-outline-variant transition-colors">
                <span class="material-symbols-outlined text-[18px]">upload</span>이미지 선택
            </label>
            <input id="event-poster" type="file" accept=".jpg,.jpeg,.png" (change)="onFileSelected($event)" (cancel)="$event.stopPropagation()" class="hidden" />
            <p class="text-xs text-outline">JPG, PNG (최대 5MB)</p>
            @if (uploading()) {
            <p class="text-sm text-primary font-medium flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                업로드 중...
            </p>
            }
        </div>
    </div>
</app-form-field>
```

#### 생성할 파일
- `apps/admin/src/app/components/image-upload/image-upload.component.ts`
- `apps/admin/src/app/components/image-upload/image-upload.component.html`

#### 컴포넌트 구현

**image-upload.component.ts:**
```ts
import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'app-image-upload',
    templateUrl: './image-upload.component.html',
    imports: [CommonModule],
})
export class ImageUploadComponent {
    inputId = input.required<string>();
    preview = input<string | null>(null);
    uploading = input<boolean>(false);
    accept = input<string>('.jpg,.jpeg,.png');
    hint = input<string>('JPG, PNG (최대 5MB)');

    fileSelected = output<File>();

    onFileChange(event: Event): void {
        const el = event.target as HTMLInputElement;
        const file = el.files?.[0];
        if (!file) return;
        this.fileSelected.emit(file);
        el.value = '';
    }
}
```

**image-upload.component.html:**
```html
<div class="flex items-start gap-6">
    <div class="w-40 h-52 rounded-lg border-2 border-dashed border-outline-variant flex items-center justify-center overflow-hidden bg-surface-container shrink-0">
        @if (preview()) {
        <img [src]="preview()" alt="미리보기" class="w-full h-full object-cover" />
        } @else {
        <div class="text-center text-outline">
            <span class="material-symbols-outlined text-3xl">image</span>
            <p class="text-xs mt-1">미리보기</p>
        </div>
        }
    </div>
    <div class="flex flex-col gap-2">
        <label [for]="inputId()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container-highest text-on-surface rounded font-medium text-sm cursor-pointer hover:bg-outline-variant transition-colors">
            <span class="material-symbols-outlined text-[18px]">upload</span>이미지 선택
        </label>
        <input [id]="inputId()" type="file" [accept]="accept()" (change)="onFileChange($event)" (cancel)="$event.stopPropagation()" class="hidden" />
        <p class="text-xs text-outline">{{ hint() }}</p>
        @if (uploading()) {
        <p class="text-sm text-primary font-medium flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            업로드 중...
        </p>
        }
    </div>
</div>
```

#### 적용 후 사용 예시 (event-form)
```html
<app-form-field label="포스터 이미지" for="event-poster">
    <app-image-upload
        inputId="event-poster"
        [preview]="imagePreview()"
        [uploading]="uploading()"
        (fileSelected)="onFileSelected($event)" />
</app-form-field>
```

#### event-form.page.ts의 onFileSelected 수정
기존 `(change)="onFileSelected($event)"` 는 `Event`를 받았지만, 컴포넌트 적용 후 `File`을 직접 받도록 변경:

```ts
// 변경 전
onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    // ...검증 로직
}

// 변경 후
onFileSelected(file: File): void {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        this.toast.warning('이미지는 JPG, PNG 형식만 업로드할 수 있습니다.');
        return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        this.toast.warning('이미지 파일 크기는 최대 5MB까지 업로드할 수 있습니다.');
        return;
    }
    this.errorMessage.set('');
    this.selectedFile = file;
    this.imagePreview.set(URL.createObjectURL(file));
}
```

---

### 5-B: `app-form-toggle`

#### 목적
CSS 기반 토글 스위치 + 상태 텍스트 표시. `ControlValueAccessor`를 구현하여 `formControlName`으로 사용 가능하게 함.

#### 사용 위치 (1곳)
- `apps/admin/src/app/pages/terms/terms-form/terms-form.page.html` — 필수 여부 토글

#### 현재 HTML
```html
<div class="flex items-center gap-3">
    <label class="relative inline-flex items-center cursor-pointer">
        <input formControlName="isRequired" id="terms-isRequired" type="checkbox" class="sr-only peer" />
        <div class="w-11 h-6 bg-outline-variant rounded-full peer-checked:bg-primary transition-colors
                    after:content-[''] after:absolute after:top-[2px] after:start-[2px]
                    after:bg-white after:rounded-full after:h-5 after:w-5
                    after:transition-all peer-checked:after:translate-x-full"></div>
    </label>
    <span class="text-sm" [class.text-primary]="form.get('isRequired')?.value"
        [class.text-on-surface-variant]="!form.get('isRequired')?.value">
        {{ form.get('isRequired')?.value ? '필수 약관' : '선택 약관' }}
    </span>
</div>
```

#### 생성할 파일
- `apps/admin/src/app/components/form-toggle/form-toggle.component.ts`
- `apps/admin/src/app/components/form-toggle/form-toggle.component.html`

#### 컴포넌트 구현 (ControlValueAccessor)

**form-toggle.component.ts:**
```ts
import { Component, forwardRef, input, signal } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'app-form-toggle',
    templateUrl: './form-toggle.component.html',
    imports: [CommonModule],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => FormToggleComponent),
        multi: true,
    }],
})
export class FormToggleComponent implements ControlValueAccessor {
    labelOn = input<string>('켜짐');    // checked 상태 텍스트
    labelOff = input<string>('꺼짐');  // unchecked 상태 텍스트
    inputId = input<string>('');

    value = signal<boolean>(false);
    isDisabled = signal<boolean>(false);

    private onChange = (_: boolean) => {};
    private onTouched = () => {};

    onToggle(event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        this.value.set(checked);
        this.onChange(checked);
        this.onTouched();
    }

    writeValue(val: boolean): void { this.value.set(!!val); }
    registerOnChange(fn: (_: boolean) => void): void { this.onChange = fn; }
    registerOnTouched(fn: () => void): void { this.onTouched = fn; }
    setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }
}
```

**form-toggle.component.html:**
```html
<div class="flex items-center gap-3">
    <label class="relative inline-flex items-center cursor-pointer" [class.opacity-50]="isDisabled()">
        <input type="checkbox" [id]="inputId()" class="sr-only peer"
            [checked]="value()" [disabled]="isDisabled()" (change)="onToggle($event)" />
        <div class="w-11 h-6 bg-outline-variant rounded-full peer-checked:bg-primary transition-colors
                    after:content-[''] after:absolute after:top-[2px] after:start-[2px]
                    after:bg-white after:rounded-full after:h-5 after:w-5
                    after:transition-all peer-checked:after:translate-x-full"></div>
    </label>
    <span class="text-sm" [class.text-primary]="value()" [class.text-on-surface-variant]="!value()">
        {{ value() ? labelOn() : labelOff() }}
    </span>
</div>
```

#### 적용 후 사용 예시 (terms-form)
```html
<app-form-field label="필수 여부" for="terms-isRequired">
    <app-form-toggle
        formControlName="isRequired"
        labelOn="필수 약관"
        labelOff="선택 약관"
        inputId="terms-isRequired" />
</app-form-field>
```

terms-form.page.ts의 `@Component imports` 배열에 `FormToggleComponent` 추가 필요.

---

## 작업 순서 요약

| 순서 | 컴포넌트 셀렉터 | 생성 파일 경로 | 적용 페이지 수 |
|------|--------------|-------------|-------------|
| 1 | `app-detail-actions` | `components/detail-actions/` | 7 |
| 2 | `app-detail-field` | `components/detail-field/` | 6 |
| 3 | `app-status-badge` | `components/status-badge/` | 5 |
| 4 | `app-empty-state` | `components/empty-state/` | 3 |
| 5a | `app-image-upload` | `components/image-upload/` | 1 (event-form) |
| 5b | `app-form-toggle` | `components/form-toggle/` | 1 (terms-form) |

모든 경로는 `apps/admin/src/app/` 기준.

## 각 컴포넌트 작업 체크리스트

각 컴포넌트마다:
1. `apps/admin/src/app/components/{name}/` 폴더 생성
2. `.component.ts` 파일 작성 (위 설계 참고)
3. `.component.html` 파일 작성 (위 설계 참고)
4. 각 적용 대상 페이지 HTML에서 기존 반복 코드 → 컴포넌트 태그로 교체
5. 각 적용 대상 페이지 TS의 `@Component` `imports` 배열에 새 컴포넌트 추가

## 참고: 기존 컴포넌트 구조

```
apps/admin/src/app/components/
├── breadcrumb/
│   └── breadcrumb.component.ts
├── data-table/
│   └── data-table.component.ts
├── detail-view/
│   └── detail-view.component.ts
├── form-actions/
│   └── form-actions.component.ts
├── form-field/          ← AbstractControl + showError 패턴 참고
│   ├── form-field.component.ts
│   └── form-field.component.html
├── form-input/          ← ControlValueAccessor 패턴 참고
│   └── form-input.component.ts
├── form-textarea/       ← ControlValueAccessor 패턴 참고
│   └── form-textarea.component.ts
├── form-view/           ← markAllAsTouched + focus 패턴 참고
│   ├── form-view.component.ts
│   └── form-view.component.html
└── page-header/
    ├── page-header.component.ts
    └── page-header.component.html
```
