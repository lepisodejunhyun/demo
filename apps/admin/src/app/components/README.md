# Admin App — 공통 컴포넌트 가이드

이 문서는 admin 앱의 페이지 구성에 사용되는 공통 컴포넌트들을 설명합니다.

---

## 1. 작업 배경 (Refactoring Summary)

### 이전 구조의 문제

- 모든 페이지(목록/상세/폼)의 외곽 컨테이너 클래스 `max-w-5xl mx-auto px-10 py-10`가 11개 파일에 중복.
- 상세/폼 페이지가 각각 `<app-detail-layout>`, `<app-form-layout>`이라는 큰 단일 컴포넌트로 묶여 있어 유연성이 낮음.
- 페이지 헤더가 페이지 타입(list / detail / form)마다 다른 구조 → 통일성 부족.

### 변경 사항 요약

1. **외곽 컨테이너 통합**
   - `apps/admin/src/app/layout/default/layout.component.html`의 `<main>` 안으로 컨테이너 이동.
   - `max-w-7xl mx-auto px-8 py-8`로 통일 → 콘텐츠 영역 944px → 1216px로 확장.
   - 11개 페이지에서 중복되던 wrapper div 제거.

2. **컴포넌트 합성 패턴 도입**
   - `<app-detail-layout>`, `<app-form-layout>` 삭제.
   - 페이지 타입별로 작은 단위 컴포넌트 7개 신규 작성.
   - 페이지가 `<app-page-header>` + body 컴포넌트(`<app-data-table>` / `<app-detail-view>` / `<app-form-view>`)를 조립하는 구조.

3. **Named Slot 패턴 적용**
   - 헤더의 breadcrumb / actions / description은 `<ng-content select="[slot=...]">`로 처리.
   - 페이지가 필요한 슬롯에만 내용을 채우고, 비어있으면 자동으로 표시 안 됨 → `@if` 분기 불필요.

### 영향 받은 파일 통계

| 구분 | 수 |
| --- | --- |
| 신규 컴포넌트 | 7개 |
| 수정 컴포넌트 | 1개 (page-header) |
| 삭제 컴포넌트 | 2개 (detail-layout, form-layout) |
| 마이그레이션 페이지 | 14개 (목록 10 + 상세 2 + 폼 2) |
| 마이그레이션 레이아웃 | 1개 (default-layout) |

---

## 2. 페이지 구성 패턴

모든 페이지는 다음 두 부분으로 구성됩니다.

```
[<app-page-header> 영역]   ← 모든 페이지 공통
[Body 영역]                ← 페이지 타입별 다른 컴포넌트
```

### 페이지 타입별 Body 컴포넌트

| 페이지 타입 | Body 컴포넌트 |
| --- | --- |
| 목록 (list) | `<app-data-table>` |
| 상세 (detail) | `<app-detail-view>` |
| 등록/수정 (form) | `<app-form-view>` |

### 외곽 여백

페이지 HTML 자체에는 외곽 wrapper를 작성하지 않습니다. `<main>`의 안쪽 wrapper에서 모든 페이지의 여백을 일관되게 관리합니다.

- 최대 너비: `max-w-7xl` (1280px)
- 좌우 패딩: `px-8` (32px)
- 상하 패딩: `py-8` (32px)

변경하려면 `apps/admin/src/app/layout/default/layout.component.html`만 수정.

---

## 3. 컴포넌트 레퍼런스

### 3.1 `<app-page-header>`

모든 페이지 상단의 헤더. breadcrumb / 타이틀 / description / 우상단 액션 영역을 슬롯으로 받습니다.

**Inputs**
- `title: string` (필수) — 페이지 타이틀

**Slots**
- `slot="breadcrumb"` — 페이지 경로 (선택). 보통 `<app-breadcrumb>` 컴포넌트를 넣음.
- `slot="actions"` — 우측 액션 버튼들 (선택). 여러 요소 가능.
- `slot="description"` — 타이틀 아래 보조 설명 (선택). 보통 `<p>` 태그.

**시각 구조**

```
[breadcrumb slot if present]
[Title]                    [actions slot if present]
[description slot if present]
```

**사용 예시**

```html
<!-- 목록 페이지: title + description + 신규 버튼 -->
<app-page-header title="FAQ 관리">
    <p slot="description" class="text-base leading-6 text-on-surface-variant mt-1">
        자주 묻는 질문을 관리합니다.
    </p>
    <a slot="actions" routerLink="/faq/create"
        class="bg-primary-container text-white px-6 py-2.5 rounded font-semibold text-xs flex items-center gap-2 hover:bg-primary transition-colors cursor-pointer">
        <span class="material-symbols-outlined text-[18px]">add</span>
        새 FAQ 등록
    </a>
</app-page-header>

<!-- 상세 페이지: breadcrumb + title + 수정/삭제 버튼 -->
<app-page-header [title]="faq.question">
    <app-breadcrumb slot="breadcrumb" [items]="breadcrumbs" />
    <a slot="actions" [routerLink]="'/faq/' + faq.id + '/edit'"
        class="px-4 py-2 text-primary font-semibold text-xs border border-outline-variant rounded hover:bg-surface-container-low transition-colors flex items-center gap-1 cursor-pointer">
        <span class="material-symbols-outlined text-[18px]">edit</span>
        수정
    </a>
    <button slot="actions" (click)="onDelete()"
        class="px-4 py-2 text-error font-semibold text-xs border border-transparent rounded hover:bg-error-container/20 transition-colors flex items-center gap-1 cursor-pointer">
        <span class="material-symbols-outlined text-[18px]">delete</span>
        삭제
    </button>
</app-page-header>

<!-- 폼 페이지: breadcrumb + title + description -->
<app-page-header [title]="isEditMode ? 'FAQ 수정' : 'FAQ 작성'">
    <app-breadcrumb slot="breadcrumb" [items]="breadcrumbs" />
    <p slot="description" class="text-base leading-6 text-on-surface-variant mt-6">
        {{ isEditMode ? 'FAQ 내용을 수정합니다.' : '새로운 FAQ를 작성하여 팀원들과 공유하세요.' }}
    </p>
</app-page-header>
```

**참고**
- description의 `mt-1`은 목록 페이지에서 title과 가깝게, `mt-6`는 폼 페이지에서 좀 더 공간 있게.
- 액션 버튼 스타일은 페이지마다 자유롭게 다를 수 있음 (slot이라 페이지가 정함).

---

### 3.2 `<app-breadcrumb>`

페이지 경로(빵 부스러기) 렌더링.

**Inputs**
- `items: Breadcrumb[]` (필수) — 경로 항목 배열

**Type**
```ts
export interface Breadcrumb {
    label: string;
    link?: string;   // 있으면 클릭 가능 링크, 없으면 현재 페이지(클릭 불가)
}
```

**사용 예시**

```html
<!-- 페이지 컴포넌트 ts에서 정의 -->
breadcrumbs: Breadcrumb[] = [
    { label: 'FAQ 관리', link: '/faq' },
    { label: '상세 보기' },
];
```

```html
<!-- 페이지 HTML에서 page-header의 breadcrumb 슬롯에 -->
<app-breadcrumb slot="breadcrumb" [items]="breadcrumbs" />
```

**참고**
- 마지막 항목 뒤의 `chevron_right` 아이콘은 CSS `:last-child`로 자동 숨김.
- `link`가 없는 항목은 검은색 텍스트 + 클릭 불가 (현재 페이지 표시).

---

### 3.3 `<app-detail-view>`

상세 페이지의 Body 컴포넌트. 메타(생성/수정 시각) + 본문 + 하단 "목록으로 돌아가기" 버튼을 한번에 처리.

**Inputs**
- `createdAt: string` (선택) — 생성 시각
- `updatedAt: string` (선택) — 수정 시각
- `backLink: string` (필수) — "목록으로 돌아가기" 버튼이 갈 경로

**Slots**
- 기본 슬롯 (`<ng-content />`) — 상세 본문 콘텐츠

**내부 구성**
- `<app-detail-meta>` 자동 포함
- `<app-back-button>` 자동 포함

**사용 예시**

```html
<app-detail-view [createdAt]="faq.createdAt" [updatedAt]="faq.updatedAt" backLink="/faq">
    <div class="whitespace-pre-wrap">{{ faq.answer }}</div>
</app-detail-view>
```

**참고**
- 본문이 단순 텍스트면 `<div class="whitespace-pre-wrap">`로 줄바꿈 보존.
- 본문에 이미지/리스트 등 복잡한 마크업도 자유롭게 넣을 수 있음.

---

### 3.4 `<app-detail-meta>`

생성일/수정일을 한 줄로 표시. 보통은 `<app-detail-view>`가 내부에서 사용하므로 직접 쓸 일은 드뭄.

**Inputs**
- `createdAt: string` (선택)
- `updatedAt: string` (선택)

**사용 예시 (직접 사용 시)**

```html
<app-detail-meta [createdAt]="faq.createdAt" [updatedAt]="faq.updatedAt" />
```

**참고**
- 두 값 모두 비어있어도 안전 (해당 항목만 안 보임).

---

### 3.5 `<app-back-button>`

상세 페이지 하단의 "목록으로 돌아가기" 버튼. 보통 `<app-detail-view>` 내부에서 사용됨.

**Inputs**
- `link: string` (필수) — 클릭 시 이동할 경로

**Slots**
- 기본 슬롯 (`<ng-content />`) — 버튼 텍스트. 비어있으면 기본 "목록으로 돌아가기" 표시.

**사용 예시 (직접 사용 시)**

```html
<app-back-button link="/faq" />
<!-- 또는 텍스트 커스텀 -->
<app-back-button link="/faq">FAQ 목록으로</app-back-button>
```

---

### 3.6 `<app-form-view>`

폼 페이지의 Body 컴포넌트. 폼 + 하단 액션 버튼(취소/등록)을 묶어서 처리.

**Inputs**
- `formGroup: FormGroup` (필수) — 페이지의 Reactive Form
- `submitText: string` (선택, 기본값 `"등록하기"`) — 제출 버튼 라벨

**Outputs**
- `(cancel)` — 취소 버튼 클릭 시
- `(submit)` — 등록 버튼 클릭 시

**Slots**
- 기본 슬롯 (`<ng-content />`) — 폼 필드들. 보통 `<app-form-field>`들로 채움.

**내부 구성**
- `<form [formGroup]="...">` 자동 래핑
- `<app-form-actions>` 자동 포함

**사용 예시**

```html
<app-form-view [formGroup]="form" 
               [submitText]="isEditMode ? '수정하기' : '등록하기'"
               (cancel)="goBack()" 
               (submit)="onSubmit()">
    <app-form-field label="질문" for="faq-question">
        <input formControlName="question" id="faq-question" type="text" ... />
    </app-form-field>
    <app-form-field label="답변" for="faq-answer">
        <textarea formControlName="answer" id="faq-answer" ...></textarea>
    </app-form-field>

    @if (errorMessage) {
        <p class="text-error text-sm">{{ errorMessage }}</p>
    }
</app-form-view>
```

---

### 3.7 `<app-form-field>`

폼 필드 하나 단위(라벨 + 입력 요소).

**Inputs**
- `label: string` (필수) — 라벨 텍스트
- `for: string` (선택) — 라벨이 가리킬 input id

**Slots**
- 기본 슬롯 (`<ng-content />`) — input / textarea / select 등
- `slot="error"` — 에러 메시지 (선택)

**사용 예시**

```html
<app-form-field label="질문" for="faq-question">
    <input formControlName="question" id="faq-question" type="text" maxlength="200" placeholder="질문을 입력하세요"
        class="w-full px-4 py-3 border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-base transition-all placeholder:text-outline" />
    <p slot="error" class="text-error text-sm">필수 입력입니다.</p>
</app-form-field>
```

**참고**
- input 자체 스타일 클래스는 페이지에서 직접 적용 (form-field가 강제하지 않음).
- 다양한 입력 타입(`<input>`, `<textarea>`, `<select>`, 커스텀 컴포넌트) 모두 슬롯에 들어갈 수 있음.

---

### 3.8 `<app-form-actions>`

폼 페이지 하단의 취소/등록 버튼 한 쌍. 보통 `<app-form-view>`가 내부에서 사용하므로 직접 쓸 일은 드뭄.

**Inputs**
- `submitText: string` (선택, 기본값 `"등록하기"`)

**Outputs**
- `(cancel)`
- `(submit)`

---

### 3.9 `<app-data-table>` (기존)

목록 페이지의 테이블 + 페이지네이션.

**Inputs**
- `columns: ColumnDef[]` (필수) — 컬럼 정의
- `items: any[]` (필수) — 표시할 데이터
- `pageInfo: PageInfo | null` — 페이지 정보
- `emptyIcon: string` — 빈 상태 아이콘 (기본값 `'quiz'`)
- `emptyMessage: string` — 빈 상태 메시지

**Outputs**
- `(rowClick)` — 행 클릭
- `(pageChange)` — 페이지 변경

자세한 사용법은 기존 페이지 코드(`event.page.ts`, `faq.page.ts` 등) 참고.

---

## 4. 페이지 작성 가이드

### 4.1 새 목록 페이지 만들기

```html
<app-page-header title="[페이지 제목]">
    <p slot="description" class="text-base leading-6 text-on-surface-variant mt-1">
        [페이지 설명]
    </p>
    <!-- 신규 등록 버튼이 필요할 때만 -->
    <a slot="actions" routerLink="/[domain]/create"
        class="bg-primary-container text-white px-6 py-2.5 rounded font-semibold text-xs flex items-center gap-2 hover:bg-primary transition-colors cursor-pointer">
        <span class="material-symbols-outlined text-[18px]">add</span>
        새 [도메인] 등록
    </a>
</app-page-header>

<app-data-table [columns]="columns" [items]="items" [pageInfo]="pageInfo"
                emptyMessage="등록된 항목이 없습니다."
                (rowClick)="goDetail($event)" 
                (pageChange)="loadData($event)" />
```

**필요한 imports** (페이지 ts):
```ts
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { DataTableComponent } from "../../components/data-table/data-table.component";
import { ColumnDef, PageInfo } from "../../components/data-table/data-table.types";
```

### 4.2 새 상세 페이지 만들기

```html
@if (item) {
<app-page-header [title]="item.title">
    <app-breadcrumb slot="breadcrumb" [items]="breadcrumbs" />
    <a slot="actions" [routerLink]="'/[domain]/' + item.id + '/edit'"
        class="px-4 py-2 text-primary font-semibold text-xs border border-outline-variant rounded hover:bg-surface-container-low transition-colors flex items-center gap-1 cursor-pointer">
        <span class="material-symbols-outlined text-[18px]">edit</span>
        수정
    </a>
    <button slot="actions" (click)="onDelete()"
        class="px-4 py-2 text-error font-semibold text-xs border border-transparent rounded hover:bg-error-container/20 transition-colors flex items-center gap-1 cursor-pointer">
        <span class="material-symbols-outlined text-[18px]">delete</span>
        삭제
    </button>
</app-page-header>

<app-detail-view [createdAt]="item.createdAt" [updatedAt]="item.updatedAt" backLink="/[domain]">
    <!-- 상세 본문은 자유롭게 -->
    <div class="whitespace-pre-wrap">{{ item.content }}</div>
</app-detail-view>
}
```

**필요한 imports**:
```ts
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { DetailViewComponent } from "../../../components/detail-view/detail-view.component";
```

페이지 ts에 `breadcrumbs` 배열 정의:
```ts
breadcrumbs: Breadcrumb[] = [
    { label: '[도메인] 관리', link: '/[domain]' },
    { label: '상세 보기' },
];
```

### 4.3 새 폼 페이지 만들기

```html
<app-page-header [title]="isEditMode ? '[도메인] 수정' : '[도메인] 작성'">
    <app-breadcrumb slot="breadcrumb" [items]="breadcrumbs" />
    <p slot="description" class="text-base leading-6 text-on-surface-variant mt-6">
        {{ isEditMode ? '[수정 안내]' : '[작성 안내]' }}
    </p>
</app-page-header>

<app-form-view [formGroup]="form" 
               [submitText]="isEditMode ? '수정하기' : '등록하기'"
               (cancel)="goBack()" 
               (submit)="onSubmit()">
    <app-form-field label="[필드명]" for="[id]">
        <input formControlName="[name]" id="[id]" type="text" ... 
               class="w-full px-4 py-3 border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-base transition-all placeholder:text-outline" />
    </app-form-field>

    <!-- 필요한 만큼 form-field 추가 -->

    @if (errorMessage) {
    <p class="text-error text-sm">{{ errorMessage }}</p>
    }
</app-form-view>
```

**필요한 imports**:
```ts
import { ReactiveFormsModule } from "@angular/forms";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { FormViewComponent } from "../../../components/form-view/form-view.component";
import { FormFieldComponent } from "../../../components/form-field/form-field.component";
```

---

## 5. Named Slot 패턴 빠른 참고

이 프로젝트에서는 `<ng-content select="[slot=...]">` 기반의 named slot 패턴을 적극 사용합니다.

### 사용 규칙

1. 슬롯이 정의된 컴포넌트의 자식으로 요소를 넣을 때, 해당 요소에 `slot="[이름]"` 속성을 부여.
2. 슬롯 이름은 컴포넌트가 정의한 select 셀렉터(`[slot=breadcrumb]` 등)와 일치해야 함.
3. 슬롯이 정의되지 않은 자식 요소는 무시됨 (default slot이 없는 한).

### 슬롯 매핑 표

| 컴포넌트 | 슬롯 이름 | 받는 요소 예시 |
| --- | --- | --- |
| `<app-page-header>` | `breadcrumb` | `<app-breadcrumb>` |
| `<app-page-header>` | `actions` | `<a>`, `<button>` 등 (여러 개 가능) |
| `<app-page-header>` | `description` | `<p>` |
| `<app-detail-view>` | (default) | 본문 콘텐츠 |
| `<app-form-view>` | (default) | 폼 필드들 |
| `<app-form-field>` | (default) | `<input>` / `<textarea>` 등 |
| `<app-form-field>` | `error` | `<p>` 에러 메시지 |
| `<app-back-button>` | (default) | 버튼 라벨 텍스트 |

### 자주 하는 실수

- 슬롯 이름 오타 (`slot="action"` vs `slot="actions"`) → 해당 자식이 사라짐.
- `slot` 속성을 빠뜨림 → 슬롯이 select하지 않는 자식이 됨 → 사라짐.
- default slot이 정의되지 않은 컴포넌트에 slot 없는 자식 넣음 → 사라짐.

---

## 6. 스타일 변경 위치

자주 바뀔 만한 스타일을 어디서 수정하는지 매핑:

| 변경 대상 | 수정 위치 |
| --- | --- |
| 페이지 외곽 여백/너비 | `apps/admin/src/app/layout/default/layout.component.html` |
| 사이드바, 헤더 영역 | `apps/admin/src/app/layout/[sidebar/header]/...` |
| 페이지 타이틀 스타일 | `apps/admin/src/app/components/page-header/page-header.component.html` |
| breadcrumb 색상/크기 | `apps/admin/src/app/components/breadcrumb/breadcrumb.component.html` |
| 본문 영역 구분선(`border-t`) | `apps/admin/src/app/components/detail-view/detail-view.component.html` |
| 폼 액션 버튼 스타일 | `apps/admin/src/app/components/form-actions/form-actions.component.html` |
| 라벨 스타일 | `apps/admin/src/app/components/form-field/form-field.component.html` |
| 테이블 행/셀 스타일 | `apps/admin/src/app/components/data-table/data-table.component.html` |

---

## 7. 향후 고려 사항

리팩토링 후 다음 단계로 가치 있을 만한 작업들:

- `<app-empty-state>` — 현재 data-table 내부에 박혀있는 빈 상태 UI를 분리.
- `<app-confirm-dialog>` — 브라우저 기본 `confirm()` 대체. 삭제 확인 등에서 일관된 UI 제공.
- `<app-page-action-button>` — 페이지마다 반복되는 액션 버튼 스타일(primary / secondary / danger)을 컴포넌트로.
- data-table에 `<ng-template>` 기반 cell template 슬롯 도입 — 상태 배지, 이미지 등 커스텀 셀 렌더링이 필요해질 때.
