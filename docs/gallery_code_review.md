# 갤러리 기능 코드 리뷰

> 갤러리의 **목록, 상세, 등록/수정** 페이지를 한 줄 한 줄 설명하는 문서입니다.

---

## 1. 목록 페이지 (gallery.page.ts)

### 1-1. import 영역 (1~8줄)

```typescript
import { CommonModule } from "@angular/common";
```
- Angular의 **기본 기능 모음**이에요. `@if`, `@for`, 날짜 변환(`| date`) 같은 것들을 쓸 수 있게 해줘요.

```typescript
import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
```
- `Component` → "이 파일은 화면을 그리는 컴포넌트야"라고 선언하는 데 필요해요
- `OnInit` → 페이지가 처음 열릴 때 자동으로 실행되는 함수(`ngOnInit`)를 쓰겠다는 약속
- `inject` → 다른 서비스(도구)를 가져다 쓰는 방법
- `ChangeDetectorRef` → 데이터가 바뀌었을 때 화면을 다시 그리라고 알려주는 도구

```typescript
import { CardGridComponent } from "../../components/card-grid/card-grid.component";
```
- 카드 형태로 이미지를 보여주는 **공통 컴포넌트**를 가져와요.

```typescript
import { Api, galleryControllerFindAll, GalleryDto } from "@api-client";
```
- `Api` → 서버와 통신하는 도구
- `galleryControllerFindAll` → "갤러리 목록을 달라"는 API 요청 함수
- `GalleryDto` → 서버에서 오는 갤러리 데이터의 **형태(타입)**. `{ id, title, thumbnailUrl, createdAt, ... }`

```typescript
import { CardGridConfig } from "../../components/card-grid/card-grid.types";
```
- 카드 그리드에서 **어떤 필드를 이미지/제목/날짜로 쓸지** 설정하는 타입

### 1-2. 컴포넌트 선언 (10~14줄)

```typescript
@Component({
    selector: 'app-gallery',           // HTML에서 <app-gallery>로 사용
    templateUrl: './gallery.page.html', // 이 컴포넌트의 화면(HTML) 파일 경로
    imports: [CommonModule, PageHeaderComponent, CardGridComponent, RouterLink]
    // ↑ 이 컴포넌트에서 사용할 다른 컴포넌트/모듈 목록
})
```

### 1-3. 클래스 본체 (15~61줄)

```typescript
export default class GalleryPage implements OnInit {
```
- `export default` → 라우터에서 `import()`로 이 페이지를 불러올 수 있게 해요
- `implements OnInit` → "이 페이지는 열릴 때 ngOnInit을 실행할 거야"

```typescript
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly route = inject(ActivatedRoute);
```
- `api` → 서버에 데이터 요청하는 도구
- `router` → 다른 페이지로 이동시키는 도구. 예: `/gallery/123`으로 이동
- `cdr` → 화면 갱신 도구. 데이터가 바뀌면 `cdr.markForCheck()`로 "화면 다시 그려!"라고 알림
- `route` → 현재 URL 정보를 읽는 도구. 예: `?page=2`에서 `2`를 가져옴

```typescript
    galleries: GalleryDto[] = [];
```
- 서버에서 받아온 갤러리 목록을 저장하는 **배열**. 처음엔 비어있음 `[]`

```typescript
    pageInfo: PageInfo | null = null;
```
- 페이지 정보 (현재 페이지, 총 페이지 수 등). 데이터를 아직 안 받았으면 `null`

```typescript
    config: CardGridConfig = {
        imageField: 'thumbnailUrl',  // 카드 이미지 = 갤러리의 thumbnailUrl 필드
        titleField: 'title',         // 카드 제목 = 갤러리의 title 필드
        dateField: 'createdAt',      // 카드 날짜 = 갤러리의 createdAt 필드
    };
```
- 카드 그리드 컴포넌트에게 **"데이터에서 어떤 필드를 가져다 쓸지"** 알려주는 설정
- data-table의 `ColumnDef`와 비슷한 역할이지만, 카드는 항상 이미지/제목/날짜 구조가 고정이라 객체로 매핑

```typescript
    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
```
- 페이지가 열리면 자동 실행. URL의 `?page=2` 같은 값을 **계속 감시**해요
- `subscribe` → "값이 바뀔 때마다 이 함수를 실행해줘"라는 뜻 (구독)

```typescript
            const page = Number(params['page']) || 1;
```
- URL에서 `page` 값을 숫자로 변환. 없으면 기본값 `1`
- `Number("2")` → `2`, `Number(undefined)` → `NaN`, `NaN || 1` → `1`

```typescript
            this.loadData(page);
```
- 해당 페이지의 데이터를 서버에서 가져오는 함수 호출

```typescript
    async loadData(page: number): Promise<void> {
```
- `async` → 이 함수 안에서 서버 응답을 **기다릴 수 있어요** (`await` 사용 가능)

```typescript
        try {
            const result = await this.api.invoke(galleryControllerFindAll, {
                page,
                limit: 8,
            });
```
- `try` → "에러가 날 수 있으니 감싸서 보호하겠다"
- `api.invoke` → 서버에 요청을 보내요
- `galleryControllerFindAll` → **GET /api/gallery** 요청
- `{ page, limit: 8 }` → "2페이지, 한 번에 8개씩 줘"
- `await` → 서버 응답이 올 때까지 기다림
- `result` → `{ items: [...갤러리 8개], pageInfo: { page: 2, totalPages: 3, ... } }`

```typescript
            this.galleries = result.items ?? [];
```
- 서버에서 받은 갤러리 목록을 저장. `??` → items가 null이면 빈 배열 사용

```typescript
            this.pageInfo = result.pageInfo ?? null;
            this.cdr.markForCheck();
```
- 페이지 정보 저장 후, **화면을 다시 그려요**

```typescript
    onPageChange(page: number): void {
        this.router.navigate([], {
            queryParams: { page },
        });
    }
```
- 페이지네이션 버튼 클릭 시 실행. URL을 `?page=3`으로 변경
- URL이 바뀌면 `ngOnInit`의 `subscribe`가 감지 → `loadData(3)` 자동 호출

```typescript
    goDetail(gallery: GalleryDto): void {
        this.router.navigate(['/gallery', gallery.id]);
    }
```
- 카드 클릭 시 상세 페이지로 이동. 예: `/gallery/abc-123`

---

### 1-4. 목록 HTML (gallery.page.html)

```html
<app-page-header title="갤러리 관리">
```
- 페이지 상단 제목 영역

```html
    <a slot="actions" routerLink="/gallery/create" ...>
        새 갤러리 등록
    </a>
```
- `slot="actions"` → page-header의 오른쪽 영역에 배치
- `routerLink="/gallery/create"` → 클릭하면 등록 페이지로 이동

```html
<app-card-grid [items]="galleries" [config]="config" [pageInfo]="pageInfo"
    emptyMessage="등록된 갤러리가 없습니다."
    (rowClick)="goDetail($event)" (pageChange)="onPageChange($event)" />
```
- `[items]` → 갤러리 데이터 배열 전달
- `[config]` → 어떤 필드를 보여줄지 설정 전달
- `(rowClick)` → 카드 클릭 시 `goDetail` 실행. `$event`는 클릭한 갤러리 객체
- `(pageChange)` → 페이지 번호 클릭 시 `onPageChange` 실행

---

## 2. 상세 페이지 (gallery-detail.page.ts)

### 2-1. import & 선언 (1~13줄)

다른 페이지와 동일한 구조. 특이한 점:
```typescript
import { galleryControllerFindById, galleryControllerRemove, GalleryDto } from "@api-client";
```
- `findById` → 갤러리 1개 조회 (GET /api/gallery/:id)
- `remove` → 갤러리 삭제 (DELETE /api/gallery/:id)

### 2-2. 클래스 본체 (14~69줄)

```typescript
    id = input<string>();
```
- URL의 `:id` 부분을 자동으로 받아요. `/gallery/abc-123` → `id()` = `"abc-123"`
- Angular의 **route parameter binding** 기능

```typescript
    gallery: GalleryDto | null = null;
```
- 서버에서 받은 갤러리 상세 데이터. 아직 안 받았으면 `null`
- `GalleryDto`는 목록과 달리 `images` 배열(전체 이미지)을 포함

```typescript
    breadcrumbs: Breadcrumb[] = [
        { label: '갤러리 관리', link: '/gallery' },
        { label: '상세 보기' },
    ];
```
- 상단에 `갤러리 관리 > 상세 보기` 형태의 경로 표시

```typescript
    async ngOnInit(): Promise<void> {
        const id = this.id();
        if (!id) return;
```
- `this.id()` → URL에서 id를 가져옴. 없으면 아무것도 안 함

```typescript
        try {
            this.gallery = await this.api.invoke(galleryControllerFindById, { id });
            this.cdr.markForCheck();
        } catch (error) {
            this.router.navigate(['/gallery']);
        }
```
- 서버에서 갤러리 데이터 조회. 실패하면(없는 ID 등) 목록 페이지로 돌아감

```typescript
    async onDelete() {
        if (!confirm('정말 삭제하시겠습니까?')) return;
```
- `confirm()` → 브라우저 기본 확인 팝업. "확인" 누르면 `true`, "취소"면 `false`
- `false`면 `return`으로 함수 종료 → 삭제 안 함

```typescript
        await this.api.invoke(galleryControllerRemove, { id: this.gallery!.id });
        this.router.navigate(['/gallery']);
```
- `gallery!.id` → `!`는 "이 값은 반드시 있어"라고 TypeScript에게 알려주는 것
- 삭제 후 목록 페이지로 이동

```typescript
    selectedImage: string | null = null;
```
- 확대해서 볼 이미지 URL. `null`이면 확대 보기가 안 보임

```typescript
    openImage(url: string): void { this.selectedImage = url; }
    closeImage(): void { this.selectedImage = null; }
```
- 이미지 클릭 → URL 저장 → 확대 팝업 표시
- 팝업 클릭 → `null`로 → 팝업 사라짐

---

### 2-3. 상세 HTML (gallery-detail.page.html)

```html
@if (gallery) {
```
- 데이터가 아직 안 왔으면(`null`) 아무것도 안 보여줘요. 로딩 중 에러 방지

```html
<app-detail-view [createdAt]="gallery.createdAt" [updatedAt]="gallery.updatedAt">
```
- 공통 상세 컴포넌트. 등록일/수정일 표시 + 뒤로가기 버튼 자동 포함

```html
    <div class="grid grid-cols-4 gap-4">
```
- CSS Grid로 **한 줄에 4개**씩 배치. `gap-4`는 간격 16px

```html
        @for (img of gallery.images; track img.id) {
```
- `gallery.images` 배열을 반복하면서 이미지 하나씩 그려요
- `track img.id` → Angular이 효율적으로 화면을 업데이트하기 위한 고유 식별자

```html
        <div (click)="openImage(img.url)" class="aspect-[4/3] ... cursor-pointer">
            <img [src]="img.url" class="... hover:scale-105 transition-transform duration-300" />
```
- 클릭하면 `openImage` 실행 → 확대 보기
- `aspect-[4/3]` → 가로:세로 = 4:3 비율 고정
- `hover:scale-105` → 마우스 올리면 5% 확대 효과

```html
<!-- 이미지 확대 보기 -->
@if (selectedImage) {
<div (click)="closeImage()" class="fixed inset-0 z-50 bg-black/80 ...">
    <img [src]="selectedImage" class="max-w-[90vw] max-h-[90vh] object-contain" />
</div>
}
```
- `selectedImage`가 있을 때만 표시
- `fixed inset-0` → 화면 전체를 덮는 오버레이
- `bg-black/80` → 80% 불투명 검정 배경
- `max-w-[90vw]` → 화면 너비의 90%까지만 (넘치지 않게)
- `object-contain` → 이미지 비율을 유지하면서 영역 안에 맞춤
- 오버레이 아무 곳이나 클릭하면 `closeImage()`로 닫힘

---

## 3. 등록/수정 페이지 (gallery-form.page.ts)

### 3-1. 핵심 속성 (24~43줄)

```typescript
    id = input<string>();
```
- 등록: URL이 `/gallery/create` → `id()` = `undefined`
- 수정: URL이 `/gallery/abc-123/edit` → `id()` = `"abc-123"`

```typescript
    get isEditMode() { return !!this.id(); }
```
- `get` → 매번 자동 계산되는 값 (함수처럼 동작하지만 `()` 없이 접근)
- `!!` → 값을 `true/false`로 변환. id가 있으면 `true`(수정), 없으면 `false`(등록)

```typescript
    imageItems: { type: 'existing' | 'new'; url: string; file?: File }[] = [];
```
- **이미지 관리 배열**. 각 항목은:
  - `type: 'existing'` → 서버에 이미 저장된 이미지 (수정 모드에서 불러온 것)
  - `type: 'new'` → 사용자가 방금 선택한 새 이미지
  - `url` → 미리보기용 URL (기존: `https://...`, 새: `blob:...`)
  - `file?` → 새 이미지만 가지고 있는 실제 파일 객체. `?`는 "없을 수도 있음"

```typescript
    form = new FormGroup({
        title: new FormControl('', {
            validators: [Validators.required],
            nonNullable: true,
        }),
        content: new FormControl<string | null>(null),
    });
```
- `FormGroup` → 여러 입력 필드를 묶어서 관리하는 **폼 객체**
- `FormControl('')` → 초기값 빈 문자열
- `Validators.required` → 이 필드는 **필수 입력**. 비어있으면 `form.invalid = true`
- `nonNullable: true` → 이 필드는 절대 `null`이 될 수 없음
- `content`는 `null` 허용 → 선택 입력

### 3-2. 파일 선택 (45~58줄)

```typescript
    onFilesSelected(event: Event) {
        const input = event.target as HTMLInputElement;
```
- `<input type="file">` 클릭 후 파일을 선택하면 실행
- `event.target` → 이벤트가 발생한 HTML 요소 (= input 태그)
- `as HTMLInputElement` → TypeScript에게 "이건 input 태그야"라고 알려줌

```typescript
        const files = input.files;
        if (!files || files.length === 0) return;
```
- `input.files` → 사용자가 선택한 파일 목록
- 파일을 안 골랐으면 함수 종료

```typescript
        for (let i = 0; i < files.length; i++) {
            this.imageItems.push({
                type: 'new',
                url: URL.createObjectURL(files[i]),
                file: files[i],
            });
        }
```
- 선택한 파일을 하나씩 `imageItems` 배열에 추가
- `URL.createObjectURL(file)` → 파일을 **임시 URL**로 변환 (브라우저 메모리에만 존재)
  - 예: `blob:http://localhost:4200/abc-123`
  - 이걸 `<img src="blob:...">` 에 넣으면 미리보기가 됨
  - 서버에 업로드된 건 아님! 아직 내 컴퓨터에만 있는 상태

```typescript
        input.value = '';
```
- input의 값을 초기화. 같은 파일을 다시 선택할 수 있게 해줌

### 3-3. 이미지 삭제 (61~64줄)

```typescript
    removeImage(index: number) {
        this.imageItems.splice(index, 1);
        this.cdr.markForCheck();
    }
```
- `splice(index, 1)` → 배열에서 해당 위치의 항목 **1개를 제거**
- 기존 이미지든 새 이미지든 **같은 배열**에 있으니 인덱스만으로 정확히 삭제 가능

### 3-4. 제출 (66~106줄)

```typescript
    async onSubmit() {
        if (this.form.invalid) return;
```
- 필수 필드(제목)가 비어있으면 제출 안 함

```typescript
        this.uploading = true;
        const imageUrls: string[] = [];
```
- 업로드 중 표시 활성화 + 최종 URL을 모을 빈 배열

```typescript
        for (const item of this.imageItems) {
            if (item.type === 'existing') {
                imageUrls.push(item.url);
```
- **기존 이미지**: 이미 서버에 있으니 URL만 그대로 수집. 업로드 필요 없음

```typescript
            } else if (item.file) {
                const url = await this.supabaseService.uploadImage(item.file, 'gallery');
                imageUrls.push(url);
            }
```
- **새 이미지**: Supabase Storage에 **실제 업로드** 후 반환된 URL을 수집
- `'gallery'` → Supabase의 gallery 폴더에 저장

```typescript
        const data = {
            ...this.form.getRawValue(),
            imageUrls,
        };
```
- `getRawValue()` → 폼의 모든 값을 객체로 꺼냄: `{ title: "제목", content: "내용" }`
- `...` (스프레드) → 객체를 펼쳐서 합침
- 최종 결과: `{ title: "제목", content: "내용", imageUrls: ["https://...", "https://..."] }`

```typescript
        if (this.isEditMode) {
            await this.api.invoke(galleryControllerUpdate, {
                id: this.id()!,
                body: data,
            });
            this.router.navigate(['/gallery', this.id()]);
```
- **수정 모드**: PATCH /api/gallery/:id 요청 → 완료 후 상세 페이지로 이동

```typescript
        } else {
            const gallery = await this.api.invoke(galleryControllerCreate, {
                body: data,
            });
            this.router.navigate(['/gallery', gallery.id]);
        }
```
- **등록 모드**: POST /api/gallery/create 요청 → 서버가 새 ID를 줌 → 상세 페이지로 이동

```typescript
        } catch (error: any) {
            this.errorMessage = error?.error?.message || '요청이 실패했습니다.'
        } finally {
            this.uploading = false;
            this.cdr.markForCheck();
        }
```
- `catch` → 에러 발생 시 에러 메시지 표시
- `finally` → 성공/실패 상관없이 항상 실행. 업로드 중 표시 해제 + 화면 갱신

### 3-5. 초기 데이터 로드 (108~130줄)

```typescript
    async ngOnInit() {
        const id = this.id();
        this.breadcrumbs = [
            { label: '갤러리 관리', link: '/gallery' },
            { label: this.isEditMode ? '수정' : '등록' },
        ];
```
- 수정이면 `갤러리 관리 > 수정`, 등록이면 `갤러리 관리 > 등록`

```typescript
        if (id) {
            const gallery = await this.api.invoke(galleryControllerFindById, { id });
            this.form.patchValue(gallery);
```
- **수정 모드에서만** 실행 (id가 있을 때)
- `patchValue(gallery)` → 서버 데이터를 폼에 채워넣음. 제목, 내용이 자동으로 입력됨

```typescript
            if (gallery.images && gallery.images.length > 0) {
                this.imageItems = gallery.images.map((img: any) => ({
                    type: 'existing' as const,
                    url: img.url,
                }));
            }
```
- 기존 이미지들을 `imageItems` 배열에 `type: 'existing'`으로 등록
- `as const` → TypeScript에게 `'existing'`이 정확히 이 값이라고 알려줌
- `map()` → 배열의 각 항목을 **다른 형태로 변환**
  - `[{id, url, ...}, ...]` → `[{type: 'existing', url}, ...]`

---

## 4. 다른 메뉴(공지/행사)와 다른 점 요약

| 구분 | 공지/FAQ | 행사 | **갤러리** |
|---|---|---|---|
| 목록 UI | DataTable (표) | DataTable (표) | **CardGrid (카드)** |
| 필드 설정 | `ColumnDef[]` | `ColumnDef[]` | **`CardGridConfig`** |
| 이미지 | 없음 | 포스터 1장 | **다중 이미지** |
| 이미지 관리 | - | `selectedFile` 1개 | **`imageItems[]` 배열** |
| 상세 이미지 | - | 포스터 1장 표시 | **그리드 + 확대 보기** |

---

## 5. 데이터 흐름 전체 요약

```
[등록]
사용자 → 파일 선택 → imageItems에 type:'new'로 추가
      → 제출 → Supabase에 업로드 → URL 수집
      → 서버에 { title, content, imageUrls } 전송
      → 서버: Gallery 생성 + Attachment 생성

[수정]
페이지 진입 → 서버에서 기존 데이터 조회 → 폼에 채움 + imageItems에 type:'existing'으로 로드
           → 기존 이미지 삭제 (X버튼) → imageItems에서 splice
           → 새 이미지 추가 → imageItems에 type:'new'로 push
           → 제출 → existing은 URL만, new는 업로드 후 URL
           → 서버: Gallery 수정 + 기존 Attachment 전체 삭제 + 새 Attachment 생성

[삭제]
상세 페이지 → 삭제 버튼 → confirm 확인 → 서버에 DELETE 요청
           → 서버: Gallery soft delete (deletedAt 설정)
```
