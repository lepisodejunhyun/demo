# 리팩토링 계획서

작성일: 2026-05-20
대상 앱: `apps/server`, `apps/server-shop`, `apps/admin`, `apps/shop`

## 작업 원칙 (필독)

- **기존 코드 스타일을 그대로 따른다.** 임의로 "더 깔끔하게" 변경 금지.
  - 4-space 들여쓰기
  - JSDoc 스타일: `@name`, `@description`, `@param`, `@returns`
  - `constructor(private readonly prisma: PrismaService) { }`
  - 메서드명: `findAll`, `findById`, `create`, `update`, `remove`
  - 에러 메시지는 한글
- 각 작업 시작 전 같은 도메인의 **기존 service 파일을 먼저 읽고** 스타일 맞추기
- 한 번에 하나의 작업만 진행, PR(또는 커밋) 단위로 분리
- 작업 후 `pnpm nx run-many --target=lint --projects=server,server-shop,admin,shop` 으로 검증

---

## 우선순위 요약

| # | 작업 | 임팩트 | 영역 | 상태 |
|---|---|---|---|---|
| 1 | 페이지네이션 헬퍼 추출 | 🔴 High | 백엔드 정리 | ✅ 완료 (2026-05-20) |
| 2 | 공통 DTO를 libs로 이동 | 🔴 High | 백엔드 정리 | ✅ 완료 (2026-05-21) |
| 3 | PreRegistration N+1 제거 | 🟡 Medium | 백엔드 성능 | 대기 |
| 4 | data-table `track $index` 수정 | 🟡 Medium | 프론트 성능 | 대기 |
| 5 | EventFormPage OnPush 적용 | 🟡 Medium | 프론트 성능 | 대기 |
| 6 | queryParams Observable → toSignal | 🟡 Medium | 프론트 정리 | 대기 |
| 7 | 프론트 포맷 유틸 통합 | 🟢 Low | 프론트 정리 | 대기 |
| 8 | Prisma 인덱스 추가 | 🟢 Low | DB 성능 | 대기 |

---

## #1. 페이지네이션 헬퍼 추출 (HIGH)

### 배경
`server`와 `server-shop` 양쪽의 거의 모든 service `findAll()`에서 동일한 패턴 반복:

```ts
const skip = (page - 1) * limit;

const [items, totalItems] = await Promise.all([
    this.prisma.X.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    this.prisma.X.count({ where: { deletedAt: null } }),
]);

return {
    items,
    pageInfo: {
        page,
        limit,
        pageItems: items.length,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
    },
};
```

### 영향받는 파일

**server (7개):**
- `apps/server/src/app/faq/faq.service.ts` (findAll 단순)
- `apps/server/src/app/notice/notice.service.ts` (findAll 단순)
- `apps/server/src/app/event/event.service.ts` (findAll 단순)
- `apps/server/src/app/terms/terms.service.ts` (findAll 단순)
- `apps/server/src/app/inquiry/inquiry.service.ts` (findAll + include + flatten)
- `apps/server/src/app/pre-registration/pre-registration.service.ts` (findAll + include + flatten)
- `apps/server/src/app/gallery/gallery.service.ts` (findAll + 추가 attachment 쿼리)

**server-shop (7개 동일 도메인):**
- 동일하게 faq, notice, event, terms, inquiry, pre-registration, gallery

### 구현 단계

**Step 1.** 헬퍼 위치 결정
- 옵션 A: `apps/server/src/libs/pagination/paginate.ts` + `apps/server-shop`에도 복사 → 중복 유지(낮음)
- 옵션 B: `libs/api/pagination/` Nx 라이브러리 신규 생성 → server / server-shop 양쪽 import (권장)
- 옵션 C: `libs/shared/api-utils/` 같은 공유 디렉토리 → 옵션 B와 유사

**Step 2.** 헬퍼 시그니처 (사용자 컨펌 필요)
- 단순 케이스용 generic `paginate(model, { page, limit, where, orderBy, include, select })`
- 또는 더 작게: `buildPageInfo(items.length, totalItems, page, limit)` 만 추출 (보수적)

**Step 3.** 단순 케이스부터 적용 (faq, notice, event, terms)
- 한 파일씩 교체하며 lint/build 확인

**Step 4.** 복잡 케이스 처리
- `inquiry`, `pre-registration`: `findMany` 결과를 받아서 후처리(flatten) 후 `OffsetPaginationDto` 형태로 반환
- `gallery`: thumbnail 추가 쿼리는 헬퍼 외부에서 별도 처리
- → 헬퍼는 `{ items, pageInfo }`를 그대로 반환하되 호출 측에서 `items.map(...)` 후처리 가능하도록 설계
- 또는 `findMany`/`count`를 받아서 결과만 가공하는 패턴 고려

**Step 5.** 각 service의 findAll 교체 → 빌드/테스트

### 완료 조건
- [ ] 단순 4개 도메인 `findAll`에서 skip/Promise.all/pageInfo 보일러플레이트 제거
- [ ] 복잡 3개 도메인 적용 (또는 의도적으로 제외 결정)
- [ ] server / server-shop 동일하게 적용
- [ ] 기존 응답 스키마 동일 (`OffsetPaginationDto` 구조 유지)
- [ ] `pnpm nx build server && pnpm nx build server-shop` 성공

### 위험 요소
- 복잡 케이스(post-processing)에서 헬퍼가 오히려 가독성 저하 → 일부 의도적 제외 OK
- 응답 스키마가 살짝이라도 바뀌면 admin/shop 프론트 깨짐 → 동일 보장 필수

---

## #2. 공통 DTO를 libs로 이동 (HIGH)

### 배경
`server`와 `server-shop`에 동일 DTO가 중복 존재:
- `OffsetPaginationDto`
- `PageInfoDto`
- `PaginationQueryDto`

### 영향받는 파일

**복사본 출처(삭제 대상):**
- `apps/server/src/libs/dtos/offset-pagination.dto.ts`
- `apps/server/src/libs/dtos/page-info.dto.ts`
- `apps/server/src/libs/dtos/pagination-query.dto.ts`
- `apps/server/src/libs/dtos/index.ts`
- `apps/server-shop/src/libs/dtos/*` (동일 4개)

**참조 위치 (전체 grep 필요):**
- `apps/server/src/app/**/*.service.ts` (`OffsetPaginationDto` import)
- `apps/server/src/app/**/*.controller.ts` (`PaginationQueryDto` import)
- `apps/server-shop` 동일

### 구현 단계

**Step 1.** Nx 라이브러리 생성 (skill: `nx-generate` 참조)
```
pnpm nx g @nx/nest:lib libs/api/dtos
```
또는 기존 라이브러리에 추가 (예: `libs/api/pagination`이 #1에서 만들어지면 같은 곳).

**Step 2.** 3개 DTO 파일을 새 라이브러리로 이동
- 내용 그대로 복사 (한 줄도 바꾸지 말 것)
- `index.ts` 재작성

**Step 3.** `tsconfig.base.json`의 path alias 확인 (Nx가 자동 등록함)

**Step 4.** 모든 import 경로 일괄 치환:
```
from "../../libs/dtos"  →  from "@demo/api-dtos"  (또는 부여된 path)
```

**Step 5.** `apps/server/src/libs/dtos`, `apps/server-shop/src/libs/dtos` 폴더 삭제

**Step 6.** 양쪽 서버 빌드 확인

### 완료 조건
- [ ] 3개 DTO 단일 출처
- [ ] 양쪽 서버 import 전부 신규 경로 사용
- [ ] 기존 dtos 폴더 완전 삭제
- [ ] Swagger 스펙 변경 없음 (admin/shop 클라이언트 재생성 불필요 확인)

### 위험 요소
- `libs/api-client`, `libs/api-client-shop`이 swagger codegen 결과물일 수 있음 → DTO 이동만으로는 영향 없어야 함 (확인 필요)

---

## #3. PreRegistration N+1 제거 (MEDIUM)

### 위치
`apps/server/src/app/pre-registration/pre-registration.service.ts`
- `update()` line 172-183: 시작 시 `await this.findById(id)` 호출 (line 173)
- `remove()` line 191-200: 동일 (line 192)

### 문제
`findById()`가 `event`, `member`, `agreements`, `terms` 까지 join 해서 전체를 로드. 존재 검증용이면 과함.

### 수정 방안
존재 확인용 가벼운 메서드 추가 또는 인라인 처리:
```ts
const exists = await this.prisma.preRegistration.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
});
if (!exists) throw new NotFoundException('사전 등록 내역을 찾을 수 없습니다.');
```

### 완료 조건
- [ ] `update()` / `remove()`에서 full include 제거
- [ ] 다른 서비스(`terms.service.ts`, `inquiry.service.ts`)도 같은 패턴인지 확인 후 동일 적용

---

## #4. data-table `track $index` 수정 (MEDIUM)

### 위치
`apps/admin/src/app/components/data-table/data-table.component.html:13`

### 문제
`@for (item of items(); track $index)` → 정렬·필터 시 모든 DOM 재생성.

### 수정 방안
1. 옵션 A: 컴포넌트에 `trackBy` input 추가 → 호출 측에서 `(item) => item.id` 전달
2. 옵션 B: items에 항상 `id` 있다고 가정하고 `track item.id` 고정

→ data-table 사용처 전수 조사 후 결정.

### 완료 조건
- [ ] 모든 데이터 테이블 호출처 정렬 시 DOM diff 정상 동작
- [ ] 사용처에서 ID 없는 케이스는 fallback 처리

---

## #5. EventFormPage OnPush 적용 (MEDIUM)

### 위치
`apps/admin/src/app/pages/event/event-form/event-form.page.ts` (212줄)

### 문제
signal 사용 중인데 `ChangeDetectionStrategy.OnPush` 미적용 → 모든 키 입력마다 전체 컴포넌트 변경 감지.

### 수정 방안
```ts
@Component({
    // ...existing...
    changeDetection: ChangeDetectionStrategy.OnPush,
})
```

### 확인 사항
- signal 외 일반 변수로 상태 관리하는 곳이 있는지 (있다면 signal로 마이그레이션 먼저)
- `cdr` 사용 흔적 없는지 (현재 이미 제거됨)

### 완료 조건
- [ ] OnPush 적용 후 폼 입력/제출/취소 정상 동작
- [ ] admin 다른 form/detail 페이지도 OnPush 빠진 곳 있는지 일괄 점검

---

## #6. queryParams Observable → toSignal (MEDIUM)

### 위치
- `apps/admin/src/app/pages/notice/notice.page.ts:33`
- `apps/shop/src/app/pages/event/event.page.ts:31`
- (전 페이지 일괄 grep 필요: `route.queryParams.subscribe`)

### 문제
`route.queryParams.subscribe(...)` 후 unsubscribe 누락 → 라우터가 살아있는 동안 메모리 누수.

### 수정 방안
```ts
private queryParams = toSignal(this.route.queryParams);

constructor() {
    effect(() => {
        const page = Number(this.queryParams()?.['page']) || 1;
        this.loadData(page);
    });
}
```

### 완료 조건
- [ ] `route.queryParams.subscribe` 호출 0건 (또는 명시적으로 `takeUntilDestroyed` 사용)
- [ ] 모든 페이지 page 변경 시 정상 로드

---

## #7. 프론트 포맷 유틸 통합 (LOW)

### 위치
- `apps/admin/src/app/shared/utils/format-phone.ts` (예상)
- `apps/shop/src/app/shared/utils/format-phone.ts` (예상)
- `formatBizNum` 등

### 작업
1. 실제 중복 함수 grep으로 확인
2. `libs/shared/utils/` Nx 라이브러리 생성
3. 함수 이동, 양쪽 import 갱신

### 완료 조건
- [ ] 중복 유틸 단일 출처
- [ ] admin/shop 양쪽 빌드 성공

---

## #8. Prisma 인덱스 추가 (LOW)

### 위치
`prisma/schema.prisma` 의 각 모델

### 작업
모든 모델이 `where: { deletedAt: null }` + `orderBy: { createdAt: 'desc' }` 패턴 → 복합 인덱스 필요.

```prisma
model Notice {
    // ...existing fields...
    @@index([deletedAt, createdAt])
}
```

회원별 조회가 있는 모델(`inquiry`, `preRegistration` 등):
```prisma
@@index([memberId, deletedAt])
```

### 작업 순서
1. 각 모델의 실제 쿼리 패턴 매핑
2. 인덱스 후보 정의
3. `prisma migrate dev --name add_soft_delete_indexes` 마이그레이션 생성
4. 운영 DB 적용 전 staging에서 EXPLAIN 으로 효과 확인

### 완료 조건
- [ ] 자주 호출되는 findAll 쿼리에 인덱스 hit
- [ ] 마이그레이션 파일 review 후 적용

---

## 진행 로그

- 2026-05-20: 계획서 작성
- 2026-05-20: #1 완료
  - 신규 Nx 라이브러리 `libs/api/pagination` 생성 (`@org/api/pagination`)
  - `paginate(model, options)` 헬퍼 작성 (사용자 코드 스타일 유지: 4-space, JSDoc `@name/@description`, 한글 주석)
  - 적용 파일 13개:
    - server: faq / notice / event / terms / inquiry / pre-registration / gallery
    - server-shop: faq / notice / event / inquiry / pre-registration / gallery
  - 빌드 검증: `pnpm nx run-many --target=build --projects=server,server-shop` 통과
  - 기존 lint 룰 위반은 사용자 스타일 일관성으로 유지 (no-inferrable-types, no-explicit-any 등)
- 2026-05-21: #2 완료
  - 공통 DTO 3개를 `libs/api/pagination/src/lib/dtos/` 로 이동
    - `OffsetPaginationDto`, `PageInfoDto`, `PaginationQueryDto`
  - 26개 파일 import 경로 일괄 변경 (`../../libs/dtos` → `@org/api/pagination`)
    - Bash + sed 사용 (PowerShell의 인코딩 처리 문제로 한 차례 한글 깨짐 발생 → git revert 후 재처리)
  - 같은 모듈 import는 한 줄로 합침: `import { OffsetPaginationDto, paginate } from "@org/api/pagination";`
  - 기존 `apps/server/src/libs/dtos/`, `apps/server-shop/src/libs/dtos/` 삭제
  - paginate 헬퍼 시그니처 개선: 조건부 타입으로 모델 delegate에서 where/orderBy/include/select 자동 추출
  - inquiry/pre-registration는 `Prisma.XGetPayload<...>` 사용해 include 타입 정확히 명시
  - 빌드 검증: `pnpm nx run-many --target=build --projects=server,server-shop` 통과
