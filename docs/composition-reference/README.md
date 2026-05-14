# 컴포넌트 조합 방식 vs 래핑 방식 비교

이 폴더는 현재 `apps/admin`의 래핑 방식을 **컴포넌트 조합 방식**으로 변환한 참고 코드입니다.
실행용이 아닌 **구조 비교용**입니다.

---

## 컴포넌트 변환 요약

### Before (래핑 방식) → 2개의 큰 컴포넌트
```
components/
├── detail-layout/     ← 모든 detail 페이지를 감싸는 래퍼
├── form-layout/       ← 모든 form 페이지를 감싸는 래퍼
├── page-header/       ← 목록 페이지용 (이미 조합 방식)
└── data-table/        ← 목록 페이지용 (이미 조합 방식)
```

### After (조합 방식) → 4개의 작은 컴포넌트
```
components/
├── breadcrumb/        ← breadcrumb 네비게이션
├── page-title/        ← 제목 + 설명 + 날짜 메타정보
├── detail-actions/    ← 수정/삭제 버튼
├── form-actions/      ← 취소/등록 버튼
├── back-link/         ← 목록으로 돌아가기 링크
├── page-header/       ← 그대로 유지
└── data-table/        ← 그대로 유지
```

---

## 페이지 코드 비교

### notice-detail.page.html

**Before (래핑):**
```html
@if (notice) {
<app-detail-layout [breadcrumbs]="breadcrumbs" [title]="notice.title" 
    [createdAt]="notice.createdAt" [updatedAt]="notice.updatedAt" 
    backLink="/notice" [editLink]="'/notice/' + notice.id + '/edit'"
    (delete)="onDelete()">

    <div class="whitespace-pre-wrap">{{ notice.content }}</div>

</app-detail-layout>
}
```

**After (조합):**
```html
@if (notice) {
<div class="max-w-5xl mx-auto px-10 py-10">
    <div class="flex justify-between items-center">
        <app-breadcrumb [items]="breadcrumbs" />
        <app-detail-actions [editLink]="'/notice/' + notice.id + '/edit'" (delete)="onDelete()" />
    </div>

    <app-page-title [title]="notice.title" [createdAt]="notice.createdAt" [updatedAt]="notice.updatedAt" />

    <div class="border-t border-outline-variant pt-10 text-base leading-relaxed text-secondary">
        <div class="whitespace-pre-wrap">{{ notice.content }}</div>
    </div>

    <app-back-link link="/notice" />
</div>
}
```

### notice-form.page.html

**Before (래핑):**
```html
<app-form-layout [breadcrumbs]="breadcrumbs" [title]="..." 
    [description]="..." [submitText]="..." (cancel)="goBack()" (submit)="onSubmit()">

    <form [formGroup]="form" class="space-y-6">
        ...폼 필드들...
    </form>

</app-form-layout>
```

**After (조합):**
```html
<div class="max-w-5xl mx-auto px-10 py-10">
    <app-breadcrumb [items]="breadcrumbs" />
    <app-page-title [title]="..." [description]="..." />

    <div class="border-t border-outline-variant pt-10">
        <form [formGroup]="form" class="space-y-6">
            ...폼 필드들...
        </form>
    </div>

    <app-form-actions [submitText]="..." (cancel)="goBack()" (submit)="onSubmit()" />
</div>
```

---

## Trade-offs

| | 래핑 방식 (현재) | 조합 방식 (이 참고 코드) |
|---|---|---|
| **코드량** | 페이지 HTML이 짧음 | 페이지 HTML이 조금 길어짐 |
| **유연성** | 구조 변경이 어려움 | 페이지마다 자유롭게 구성 |
| **import 수** | 1개 (layout) | 3~4개 (개별 컴포넌트) |
| **일관성** | 강제됨 | 개발자가 직접 유지 |
| **확장성** | Named Slots 필요 | 컴포넌트 추가/제거만으로 OK |

---

## 결론

- 엔티티 2~3개, 화면 구조가 동일 → **래핑 방식 유지**
- 엔티티 증가, 화면 구조가 다양해짐 → **조합 방식으로 전환**
