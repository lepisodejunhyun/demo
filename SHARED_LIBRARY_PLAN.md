# 공유 라이브러리 추출 계획서

작성일: 2026-05-21
목적: admin / shop 양쪽에서 사용하거나, 공통화하면 유용한 컴포넌트 / 유틸을 `libs/shared/` 로 이동

---

## 전제 조건 (작업 전 반드시 확인)

- 코드 스타일: 4-space 들여쓰기, Angular 17+ 신규 API (`input()`, `output()`, `signal()`)
- standalone 컴포넌트 방식 유지
- 공통 라이브러리 경로: `@org/shared/ui`, `@org/shared/utils`
- 기존 `libs/shared/ui/src/index.ts` 에는 Toast만 존재 → 컴포넌트 추가 시 index.ts에 export 추가 필수
- 각 작업 후 빌드 검증: `pnpm nx run-many --target=build --projects=admin,shop`

---

## 현재 libs/ 구조

```
libs/
  shared/
    ui/src/
      lib/
        toast/          ← ToastService, ToastContainerComponent (기존)
      index.ts          ← 현재 Toast만 export
    models/src/         ← ProductModel만 있음 (거의 미사용)
  api/
    pagination/src/     ← paginate(), OffsetPaginationDto 등 (백엔드용)
  api-client/           ← admin API 자동생성
  api-client-shop/      ← shop API 자동생성
```

---

## 작업 목록 요약

| # | 항목 | 유형 | 현재 위치 | 우선순위 | 상태 |
|---|---|---|---|---|---|
| 1 | `libs/shared/utils` 라이브러리 생성 | 신규 lib | - | 🔴 선행 필수 | ✅ 완료 |
| 2 | `formatPhoneNumber` + `formatBusinessNumber` 유틸 이동 | 완전 동일 코드 | admin + shop | 🔴 High | ✅ 완료 |
| 3 | `PageHeaderComponent` 통합 | 약간 다름 | admin + shop | 🔴 High | 대기 |
| 4 | `BackButtonComponent` 통합 | 구현 방식 다름 | admin + shop | 🔴 High | 대기 |
| 5 | `EmptyStateComponent` 통합 | API 다름 | admin + shop | 🔴 High | 대기 |
| 6 | `FormActionsComponent` 통합 | loading input 차이 | admin + shop | 🔴 High | 대기 |
| 7 | `FormFieldComponent` 통합 | validation 유무 차이 | admin + shop | 🔴 High | 대기 |
| 7-1 | `CardGridComponent` 통합 | HTML/API 비교 필요 | admin + shop | 🔴 High | 대기 |
| 8 | `ButtonComponent` 이동 | admin → shared | admin only | 🟡 Medium | 대기 |
| 9 | `StatusBadgeComponent` 이동 | admin → shared | admin only | 🟡 Medium | 대기 |
| 10 | `BreadcrumbComponent` 이동 | admin → shared | admin only | 🟡 Medium | 대기 |
| 11 | `LoadingSpinnerComponent` 이동 | shop → shared | shop only | 🟡 Medium | 대기 |
| 12 | `PaginationComponent` 이동 | shop → shared (타입 수정) | shop only | 🟡 Medium | 대기 |
| 13 | `TabNavComponent` 이동 | shop → shared | shop only | 🟡 Medium | 대기 |
| 14 | `FormInputComponent` 이동 | admin → shared | admin only | 🟢 Low | 대기 |
| 15 | `FormTextareaComponent` 이동 | admin → shared | admin only | 🟢 Low | 대기 |
| 16 | `FormToggleComponent` 이동 | admin → shared | admin only | 🟢 Low | 대기 |

---

## #1. `libs/shared/utils` 라이브러리 생성 (선행 필수)

### 목적
`formatPhoneNumber` 등 순수 JS 유틸 함수들을 담을 Nx 라이브러리 생성.

### 명령어
```bash
pnpm nx g @nx/js:lib libs/shared/utils --importPath=@org/shared/utils --bundler=none
```

### 생성 후 확인
- `libs/shared/utils/src/index.ts` 파일이 생성되었는지 확인
- `tsconfig.base.json` 에 `"@org/shared/utils": ["libs/shared/utils/src/index.ts"]` 경로가 자동 추가되었는지 확인

---

## #2. `formatPhoneNumber` 유틸 이동

### 현황
두 파일이 **한 글자도 다르지 않은 완전 동일 코드**:
- `apps/admin/src/app/shared/utils/format-phone.ts`
- `apps/shop/src/app/shared/utils/format-phone.ts`

### 목표 위치
`libs/shared/utils/src/lib/format-phone.ts`

### 작업 단계

**Step 1.** 파일 생성
```
libs/shared/utils/src/lib/format-phone.ts
```
내용: admin의 `format-phone.ts` 코드 그대로 복사

**Step 2.** `libs/shared/utils/src/index.ts` 에 export 추가
```ts
export { formatPhoneNumber } from './lib/format-phone';
```

**Step 3.** admin import 수정
- 파일: `apps/admin/src/app/components/form-input/form-input.component.ts`
```ts
// 변경 전
import { formatPhoneNumber } from "../../shared/utils/format-phone";
// 변경 후
import { formatPhoneNumber } from "@org/shared/utils";
```

**Step 4.** shop import 수정
- 파일: `apps/shop/src/app/pages/inquiry/inquiry-form/inquiry-form.page.ts` (또는 format-phone을 import하는 shop 파일 전체 grep)
```bash
grep -r "format-phone" apps/shop/src --include="*.ts"
```
모든 결과를 `@org/shared/utils` 로 변경

**Step 5.** 기존 파일 삭제
- `apps/admin/src/app/shared/utils/format-phone.ts` 삭제
- `apps/shop/src/app/shared/utils/format-phone.ts` 삭제

**Step 6.** 빌드 검증
```bash
pnpm nx run-many --target=build --projects=admin,shop
```

---

## #3. `PageHeaderComponent` 통합

### 현황

**Admin** (`apps/admin/src/app/components/page-header/`):
```ts
export class PageHeaderComponent {
    title = input.required<string>();
}
```

**Shop** (`apps/shop/src/app/components/page-header/`):
```ts
export class PageHeaderComponent {
    title = input.required<string>();
    description = input<string>();
}
```

### 통합 API (shared 버전)
```ts
export class PageHeaderComponent {
    title = input.required<string>();
    description = input<string>();   // ← shop의 것 추가 (admin은 사용 안 해도 무방)
}
```

### HTML 템플릿 확인 필요
admin과 shop의 HTML이 다를 수 있음. 두 파일 비교 후 description을 `@if`로 조건부 렌더링.
- `apps/admin/src/app/components/page-header/page-header.component.html`
- `apps/shop/src/app/components/page-header/page-header.component.html`

### 작업 단계

**Step 1.** 두 HTML 파일 비교, 차이 파악

**Step 2.** 통합 파일 생성
```
libs/shared/ui/src/lib/page-header/page-header.component.ts
libs/shared/ui/src/lib/page-header/page-header.component.html
```

**Step 3.** `libs/shared/ui/src/index.ts` export 추가
```ts
export { PageHeaderComponent } from './lib/page-header/page-header.component';
```

**Step 4.** admin에서 import 경로 변경
- 모든 admin 페이지/컴포넌트에서:
```ts
// 변경 전
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
// 변경 후
import { PageHeaderComponent } from "@org/shared/ui";
```
```bash
grep -r "page-header.component" apps/admin/src --include="*.ts" -l
```

**Step 5.** shop에서 동일하게 변경
```bash
grep -r "page-header.component" apps/shop/src --include="*.ts" -l
```

**Step 6.** 기존 파일 삭제
- `apps/admin/src/app/components/page-header/` 폴더 전체 삭제
- `apps/shop/src/app/components/page-header/` 폴더 전체 삭제

---

## #4. `BackButtonComponent` 통합

### 현황

**Admin** (`apps/admin/src/app/components/back-button/`):
```ts
export class BackButtonComponent {
    private readonly location = inject(Location);
    goBack(): void { this.location.back(); }
}
```

**Shop** (`apps/shop/src/app/components/back-button/`):
```ts
export class BackButtonComponent {
    back = output();
}
```

### 통합 방침
Admin 방식(Location.back() 직접 호출)으로 통일.
shop에서 `(back)="..."` 이벤트를 받던 코드를 제거해야 함.

### 통합 API (shared 버전)
```ts
import { Location } from "@angular/common";
import { Component, inject } from "@angular/core";

@Component({
    selector: 'app-back-button',
    standalone: true,
    templateUrl: './back-button.component.html',
    imports: [],
})
export class BackButtonComponent {
    private readonly location = inject(Location);
    goBack(): void { this.location.back(); }
}
```

### 작업 단계

**Step 1.** shop에서 `(back)="..."` 이벤트 사용처 파악
```bash
grep -r "app-back-button" apps/shop/src --include="*.html"
```
`(back)="goBack()"` 등의 이벤트 바인딩 제거, 컴포넌트 자체적으로 뒤로가기 처리

**Step 2.** shop 페이지에서 `goBack()` 메서드 및 `Location` inject 제거 (back-button이 직접 처리하므로 불필요)

**Step 3.** 통합 파일 생성
```
libs/shared/ui/src/lib/back-button/back-button.component.ts
libs/shared/ui/src/lib/back-button/back-button.component.html
```

**Step 4.** index.ts export 추가, 양쪽 import 변경, 기존 파일 삭제

---

## #5. `EmptyStateComponent` 통합

### 현황

**Admin** (`apps/admin/src/app/components/empty-state/`):
```ts
export class EmptyStateComponent {
    icon = input.required<string>();
    title = input.required<string>();
    description = input<string | null>(null);
    actionLabel = input<string | null>(null);
    action = output<void>();
}
// → ButtonComponent에 의존
```

**Shop** (`apps/shop/src/app/components/empty-state/`):
```ts
export class EmptyStateComponent {
    icon = input<string>('inbox');
    message = input<string>('등록된 항목이 없습니다.');
}
```

### 통합 API (shared 버전)
shop의 `message` → `title` 로 통일 (admin 기준).
```ts
export class EmptyStateComponent {
    icon = input<string>('inbox');                              // shop 기본값 채택
    title = input<string>('등록된 항목이 없습니다.');           // shop의 message → title로 통일
    description = input<string | null>(null);                  // admin 추가 기능 유지
    actionLabel = input<string | null>(null);                  // admin 추가 기능 유지
    action = output<void>();                                   // admin 추가 기능 유지
}
```

### 주의사항
- admin에서 `title` 사용 중이므로 변경 없음
- shop에서 `message` → `title` 로 변경 필요
- 통합 버전은 `ButtonComponent`(shared 이동 후) 또는 일반 `<button>`으로 action 버튼 구현

### 작업 단계

**Step 1.** shop에서 `[message]="..."` 사용처 찾기
```bash
grep -r "app-empty-state" apps/shop/src --include="*.html"
```
`[message]` → `[title]` 로 변경

**Step 2.** 통합 파일 생성
```
libs/shared/ui/src/lib/empty-state/empty-state.component.ts
libs/shared/ui/src/lib/empty-state/empty-state.component.html
```

**Step 3.** HTML: description, actionLabel 조건부 렌더링 (`@if`)

**Step 4.** index.ts export 추가, 양쪽 import 변경, 기존 파일 삭제

---

## #6. `FormActionsComponent` 통합

### 현황

**Admin** (`apps/admin/src/app/components/form-actions/`):
```ts
export class FormActionsComponent {
    submitText = input<string>('등록하기');
    cancel = output<void>();
    submit = output<void>();
    onCancel(): void { this.cancel.emit(); }
    onSubmit(): void { this.submit.emit(); }
}
```

**Shop** (`apps/shop/src/app/components/form-actions/`):
```ts
export class FormActionsComponent {
    submitText = input<string>('등록하기');
    loading = input<boolean>(false);
    cancel = output();
    submit = output();
    // onCancel/onSubmit 메서드 없음 - HTML에서 직접 emit
}
```

### 통합 API (shared 버전)
```ts
export class FormActionsComponent {
    submitText = input<string>('등록하기');
    loading = input<boolean>(false);   // ← shop의 것 추가
    cancel = output<void>();
    submit = output<void>();
}
```

### 주의사항
- HTML 템플릿도 통합 필요: 버튼에 `[disabled]="loading()"` 및 로딩 스피너 조건부 표시
- admin HTML과 shop HTML 비교 후 통합 버전 작성
  - `apps/admin/src/app/components/form-actions/form-actions.component.html`
  - `apps/shop/src/app/components/form-actions/form-actions.component.html`

### 작업 단계

**Step 1.** 두 HTML 파일 비교

**Step 2.** 통합 파일 생성
```
libs/shared/ui/src/lib/form-actions/form-actions.component.ts
libs/shared/ui/src/lib/form-actions/form-actions.component.html
```

**Step 3.** admin 사용처에서 `loading` input은 무시해도 됨 (optional이므로)

**Step 4.** index.ts export 추가, 양쪽 import 변경, 기존 파일 삭제

---

## #7. `FormFieldComponent` 통합

### 현황

**Admin** (`apps/admin/src/app/components/form-field/`):
```ts
export class FormFieldComponent {
    label = input.required<string>();
    for = input<string>('');
    required = input<boolean>(false);
    control = input<AbstractControl | null>(null);
    get showError(): boolean {
        const c = this.control();
        return !!c && !!c.errors?.['required'] && c.touched;
    }
}
```

**Shop** (`apps/shop/src/app/components/form-field/`):
```ts
export class FormFieldComponent {
    label = input.required<string>();
    for = input<string>('');
    required = input<boolean>(false);
    // control 없음, validation 없음
}
```

### 통합 API (shared 버전)
admin 버전 그대로 사용 (shop은 control을 안 넘기면 그냥 무시됨).
```ts
import { AbstractControl } from "@angular/forms";

export class FormFieldComponent {
    label = input.required<string>();
    for = input<string>('');
    required = input<boolean>(false);
    control = input<AbstractControl | null>(null);  // optional이라 shop에서 안 써도 무방
    get showError(): boolean {
        const c = this.control();
        return !!c && !!c.errors?.['required'] && c.touched;
    }
}
```

### 주의사항
- admin HTML: 에러 메시지 표시 영역 있음
- shop HTML: 없음
- 통합 HTML: `@if (showError)` 로 에러 영역 조건부 표시

### 작업 단계

**Step 1.** 두 HTML 파일 비교
- `apps/admin/src/app/components/form-field/form-field.component.html`
- `apps/shop/src/app/components/form-field/form-field.component.html`

**Step 2.** 통합 파일 생성
```
libs/shared/ui/src/lib/form-field/form-field.component.ts
libs/shared/ui/src/lib/form-field/form-field.component.html
```

**Step 3.** index.ts export 추가, 양쪽 import 변경, 기존 파일 삭제

---

## #8. `ButtonComponent` 이동 (admin → shared)

### 현황
`apps/admin/src/app/components/button/button.component.ts` 만 존재.
shop에는 없어서 shop 이벤트/form-actions 에서는 일반 `<button>` 사용 중.

### 현재 API
```ts
export type ButtonVariant = 'primary' | 'ghost-primary' | 'ghost-error';

export class ButtonComponent {
    variant = input<ButtonVariant>('primary');
    icon = input<string | null>(null);
    label = input<string>();
    link = input<string | null>(null);
    action = output<void>();
}
```

### 목표 위치
```
libs/shared/ui/src/lib/button/button.component.ts
libs/shared/ui/src/lib/button/button.component.html
```

### 작업 단계

**Step 1.** 파일 이동 (내용 그대로)

**Step 2.** `libs/shared/ui/src/index.ts` export 추가
```ts
export { ButtonComponent } from './lib/button/button.component';
export type { ButtonVariant } from './lib/button/button.component';
```

**Step 3.** admin에서 import 경로 변경
```bash
grep -r "button.component" apps/admin/src --include="*.ts" -l
```
```ts
// 변경 전
import { ButtonComponent } from "../../../components/button/button.component";
// 변경 후
import { ButtonComponent } from "@org/shared/ui";
```

**Step 4.** 기존 파일 삭제
- `apps/admin/src/app/components/button/` 폴더 전체 삭제

---

## #9. `StatusBadgeComponent` 이동 (admin → shared)

### 현재 API
```ts
export type StatusBadgeVariant = 'error' | 'neutral' | 'primary' | 'outline';
export type StatusBadgeSize = 'sm' | 'xs';

export class StatusBadgeComponent {
    label = input.required<string>();
    variant = input<StatusBadgeVariant>('neutral');
    icon = input<string | null>(null);
    size = input<StatusBadgeSize>('sm');
    pill = input<boolean>(false);
}
```

### 목표 위치
```
libs/shared/ui/src/lib/status-badge/status-badge.component.ts
libs/shared/ui/src/lib/status-badge/status-badge.component.html
```

### 작업 단계

**Step 1.** 파일 이동

**Step 2.** index.ts export 추가
```ts
export { StatusBadgeComponent } from './lib/status-badge/status-badge.component';
export type { StatusBadgeVariant, StatusBadgeSize } from './lib/status-badge/status-badge.component';
```

**Step 3.** admin import 변경
```bash
grep -r "status-badge.component" apps/admin/src --include="*.ts" -l
```

**Step 4.** 기존 파일 삭제

---

## #10. `BreadcrumbComponent` 이동 (admin → shared)

### 현재 API
```ts
export interface Breadcrumb {
    label: string;
    link?: string;
}

export class BreadcrumbComponent {
    items = input.required<Breadcrumb[]>();
}
```

### 목표 위치
```
libs/shared/ui/src/lib/breadcrumb/breadcrumb.component.ts
libs/shared/ui/src/lib/breadcrumb/breadcrumb.component.html
```

### 작업 단계

**Step 1.** 파일 이동

**Step 2.** index.ts export 추가
```ts
export { BreadcrumbComponent } from './lib/breadcrumb/breadcrumb.component';
export type { Breadcrumb } from './lib/breadcrumb/breadcrumb.component';
```

**Step 3.** admin import 변경
```bash
grep -r "breadcrumb.component" apps/admin/src --include="*.ts" -l
```

**Step 4.** 기존 파일 삭제

---

## #11. `LoadingSpinnerComponent` 이동 (shop → shared)

### 현재 API
```ts
export class LoadingSpinnerComponent {
    message = input<string>('불러오는 중입니다...');
}
```

### 목표 위치
```
libs/shared/ui/src/lib/loading-spinner/loading-spinner.component.ts
libs/shared/ui/src/lib/loading-spinner/loading-spinner.component.html
```

### 작업 단계

**Step 1.** 파일 이동

**Step 2.** index.ts export 추가
```ts
export { LoadingSpinnerComponent } from './lib/loading-spinner/loading-spinner.component';
```

**Step 3.** shop import 변경
```bash
grep -r "loading-spinner.component" apps/shop/src --include="*.ts" -l
```

**Step 4.** 기존 파일 삭제

---

## #12. `PaginationComponent` 이동 (shop → shared)

### 현재 API (수정 필요)
```ts
// 현재: @api-client-shop의 PageInfoDto에 의존 → 공통화 불가
import { PageInfoDto } from '@api-client-shop';

export class PaginationComponent {
    pageInfo = input<PageInfoDto | null>(null);
    @Output() pageChange = new EventEmitter<number>();  // ← 구식 API
}
```

### 통합 API (수정 후)
`PageInfoDto` 대신 공통 인터페이스 직접 정의, output() 신규 API 사용:
```ts
export interface PageInfo {
    page: number;
    limit: number;
    pageItems: number;
    totalItems: number;
    totalPages: number;
}

export class PaginationComponent {
    pageInfo = input<PageInfo | null>(null);
    pageChange = output<number>();   // ← output() 신규 API로 변경
}
```

### 목표 위치
```
libs/shared/ui/src/lib/pagination/pagination.component.ts
libs/shared/ui/src/lib/pagination/pagination.component.html
```

### 작업 단계

**Step 1.** 위의 통합 API로 파일 생성

**Step 2.** index.ts export 추가
```ts
export { PaginationComponent } from './lib/pagination/pagination.component';
export type { PageInfo } from './lib/pagination/pagination.component';
```

**Step 3.** shop에서 import 변경 및 `PageInfoDto` 대신 `PageInfo` 타입 사용
- shop 페이지들의 `pageInfo = signal<PageInfoDto | null>(null)` → `PageInfo` 타입으로 변경
  - `PageInfoDto`의 구조가 동일하므로 런타임 변경 없이 타입만 변경
```bash
grep -r "pagination.component\|PageInfoDto" apps/shop/src --include="*.ts" -l
```

**Step 4.** 기존 파일 삭제

---

## #13. `TabNavComponent` 이동 (shop → shared)

### 현재 API
```ts
export interface TabItem {
    label: string;
    link?: string;
    id?: string;
}

export class TabNavComponent {
    items = input.required<TabItem[]>();
    activeId = input<string | null>(null);
    tabChange = output<string>();
}
```

### 목표 위치
```
libs/shared/ui/src/lib/tab-nav/tab-nav.component.ts
libs/shared/ui/src/lib/tab-nav/tab-nav.component.html
```

### 작업 단계

**Step 1.** 파일 이동

**Step 2.** index.ts export 추가
```ts
export { TabNavComponent } from './lib/tab-nav/tab-nav.component';
export type { TabItem } from './lib/tab-nav/tab-nav.component';
```

**Step 3.** shop import 변경
```bash
grep -r "tab-nav.component" apps/shop/src --include="*.ts" -l
```

**Step 4.** 기존 파일 삭제

---

## #14. `FormInputComponent` 이동 (admin → shared)

### 현재 API
```ts
export class FormInputComponent implements ControlValueAccessor {
    type = input<'text' | 'email' | 'date' | 'time' | 'tel' | 'biznum'>('text');
    maxlength = input<number | null>(null);
    placeholder = input<string>('');
    // ControlValueAccessor 구현
    // tel: formatPhoneNumber 자동 적용
    // biznum: formatBusinessNumber 자동 적용
}
```

### 주의사항
- ~~`formatPhoneNumber` import를 `@org/shared/utils`로 변경 (작업 #2 완료 후)~~ → ✅ 완료
- ~~`formatBusinessNumber` 도 `libs/shared/utils`로 이동 필요~~ → ✅ 완료
- 현재 `form-input.component.ts`에서 이미 `@org/shared/utils`로 import 중

### 목표 위치
```
libs/shared/ui/src/lib/form-input/form-input.component.ts
libs/shared/ui/src/lib/form-input/form-input.component.html
libs/shared/ui/src/lib/form-input/form-input.component.css
```

### 작업 단계

**Step 1.** `formatBusinessNumber` 도 `libs/shared/utils`로 이동 (format-phone과 동일 방법)

**Step 2.** 파일 이동, import 경로 수정

**Step 3.** index.ts export 추가
```ts
export { FormInputComponent } from './lib/form-input/form-input.component';
```

**Step 4.** admin import 변경
```bash
grep -r "form-input.component" apps/admin/src --include="*.ts" -l
```

**Step 5.** 기존 파일 삭제

---

## #15. `FormTextareaComponent` 이동 (admin → shared)

### 현재 API
```ts
export class FormTextareaComponent implements ControlValueAccessor {
    rows = input<number>(6);
    maxlength = input<number | null>(null);
    placeholder = input<string>('');
}
```

### 목표 위치
```
libs/shared/ui/src/lib/form-textarea/form-textarea.component.ts
libs/shared/ui/src/lib/form-textarea/form-textarea.component.html
libs/shared/ui/src/lib/form-textarea/form-textarea.component.css
```

### 작업 단계 (FormInput과 동일 패턴)

**Step 1.** 파일 이동

**Step 2.** index.ts export 추가

**Step 3.** admin import 변경
```bash
grep -r "form-textarea.component" apps/admin/src --include="*.ts" -l
```

**Step 4.** 기존 파일 삭제

---

## #16. `FormToggleComponent` 이동 (admin → shared)

### 현재 API
```ts
export class FormToggleComponent implements ControlValueAccessor {
    labelOn = input<string>('켜짐');
    labelOff = input<string>('꺼짐');
    inputId = input<string>('');
}
```

### 목표 위치
```
libs/shared/ui/src/lib/form-toggle/form-toggle.component.ts
libs/shared/ui/src/lib/form-toggle/form-toggle.component.html
```

### 작업 단계

**Step 1.** 파일 이동

**Step 2.** index.ts export 추가

**Step 3.** admin import 변경
```bash
grep -r "form-toggle.component" apps/admin/src --include="*.ts" -l
```

**Step 4.** 기존 파일 삭제

---

## 최종 `libs/shared/ui/src/index.ts` 목표 구조

모든 작업 완료 후 index.ts:
```ts
// Toast (기존)
export { ToastService } from './lib/toast/toast.service';
export { ToastContainerComponent } from './lib/toast/toast.component';
export type { ToastConfig, ToastItem } from './lib/toast/toast.model';

// Layout
export { PageHeaderComponent } from './lib/page-header/page-header.component';
export { BackButtonComponent } from './lib/back-button/back-button.component';
export { BreadcrumbComponent } from './lib/breadcrumb/breadcrumb.component';
export type { Breadcrumb } from './lib/breadcrumb/breadcrumb.component';
export { LoadingSpinnerComponent } from './lib/loading-spinner/loading-spinner.component';

// Navigation
export { TabNavComponent } from './lib/tab-nav/tab-nav.component';
export type { TabItem } from './lib/tab-nav/tab-nav.component';
export { PaginationComponent } from './lib/pagination/pagination.component';
export type { PageInfo } from './lib/pagination/pagination.component';

// Display
export { EmptyStateComponent } from './lib/empty-state/empty-state.component';
export { StatusBadgeComponent } from './lib/status-badge/status-badge.component';
export type { StatusBadgeVariant, StatusBadgeSize } from './lib/status-badge/status-badge.component';

// Actions
export { ButtonComponent } from './lib/button/button.component';
export type { ButtonVariant } from './lib/button/button.component';

// Form
export { FormFieldComponent } from './lib/form-field/form-field.component';
export { FormActionsComponent } from './lib/form-actions/form-actions.component';
export { FormInputComponent } from './lib/form-input/form-input.component';
export { FormTextareaComponent } from './lib/form-textarea/form-textarea.component';
export { FormToggleComponent } from './lib/form-toggle/form-toggle.component';
```

---

## 작업 순서 권장

1. ~~`#1` 라이브러리 생성~~ → ✅ 완료
2. ~~`#2` formatPhoneNumber / formatBusinessNumber~~ → ✅ 완료
3. `#3 ~ #7, #7-1` 통합 작업 (HTML 비교 필요, 주의 필요)
4. `#8 ~ #13` 이동 작업 (통합 없이 단순 이동)
5. `#14 ~ #16` form ControlValueAccessor 컴포넌트 (복잡도 높음, 마지막에)

---

## 진행 로그

- 2026-05-21: 계획서 작성
- 2026-05-21: #1 완료 (REFACTORING_PLAN #7에서 선행 처리)
  - `pnpm nx g @nx/js:lib libs/shared/utils --importPath=@org/shared/utils --bundler=none`
  - `libs/shared/utils/src/index.ts` 생성, `tsconfig.base.json` paths 자동 등록 확인
- 2026-05-21: #2 완료 (REFACTORING_PLAN #7에서 선행 처리)
  - `formatPhoneNumber`: admin/shop 중복 2벌 → `libs/shared/utils/src/lib/format-phone.ts` 단일 출처 통합
  - `formatBusinessNumber`: admin 전용 → `libs/shared/utils/src/lib/format-biznum.ts`로 이동
  - import 경로 변경: admin 4곳 + shop 1곳 = 총 5곳 (`@org/shared/utils`)
  - 기존 파일 삭제: `admin/shared/utils/format-phone.ts`, `format-biznum.ts`, `shop/shared/utils/format-phone.ts`
  - 빌드 검증: `pnpm nx run admin:build`, `pnpm nx run shop:build` 통과
- 2026-05-21: 교차 검증 결과 반영
  - `card-grid` 컴포넌트가 admin/shop 양쪽에 존재 → #7-1로 통합 항목 추가
  - #14 선행 작업(formatBusinessNumber 이동) 이미 완료 → 계획서에 반영
- 2026-05-21: #3 `PageHeaderComponent` 검토 → 보류
  - admin: 대시보드 스타일 (breadcrumb + h2 + actions slot, div 래퍼)
  - shop: 히어로 배너 스타일 (배경색 section + h1 + description input)
  - HTML 레이아웃/태그/slot 구조가 완전히 다름, 공유할 TS 로직이 input 선언 1~2줄뿐
  - 통합 시 이점 대비 복잡도가 높아 현 시점에서는 보류, 추후 디자인 통일 후 재검토
- 2026-05-21: #4 `BackButtonComponent` 검토 → 보류
  - admin: 하단 중앙, primary 채워진 버튼, "목록으로 돌아가기" + `router.navigate([listUrl])`
  - shop: 상단 좌측, ← 아이콘 텍스트 링크, "목록으로" + `(back)` output 이벤트
  - 디자인/위치/텍스트/동작 방식 전부 다름, TS 로직도 1줄뿐 → 통합 불필요
  - 부수 작업: admin `BackButtonComponent` 버그 수정
    - `location.back()` → `router.navigate([listUrl()])` 변경 (등록/수정 후 목록이 아닌 폼으로 돌아가던 문제)
    - `detail-view`에 `listUrl` input 추가, 7개 상세 페이지에 각 모듈 목록 URL 전달
    - 빌드 검증: `pnpm nx run admin:build` 통과
