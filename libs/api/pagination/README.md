# @org/api/pagination

Prisma 모델을 위한 오프셋 페이지네이션 헬퍼 + 공통 DTO 라이브러리.

서버 앱(`apps/server`, `apps/server-shop`)에서 공통으로 사용하는 페이지네이션 로직과 응답 스키마를 한 곳에 모은다.

---

## 목차

- [구성](#구성)
- [핵심 API](#핵심-api)
- [사용법](#사용법)
  - [단순 케이스](#1-단순-케이스-faq-notice-event-terms)
  - [where 조건 추가](#2-where-조건-추가-내-문의-조회)
  - [include 사용 (복잡 케이스)](#3-include-사용-inquiry-pre-registration)
  - [페이지네이션 후 추가 처리 (gallery)](#4-페이지네이션-후-추가-처리-gallery)
- [타입 추출 원리](#타입-추출-원리)
- [DTO](#dto)
- [내부 any 에 대한 설명](#내부-any-에-대한-설명)
- [리팩토링 히스토리](#리팩토링-히스토리)

---

## 구성

```
libs/api/pagination/
└── src/
    ├── index.ts                    # 진입점 (모든 public API export)
    └── lib/
        ├── pagination.ts           # paginate() 헬퍼 + 타입 정의
        └── dtos/
            ├── index.ts
            ├── page-info.dto.ts          # PageInfoDto (응답 메타)
            ├── offset-pagination.dto.ts  # OffsetPaginationDto<T> (응답 래퍼)
            └── pagination-query.dto.ts   # PaginationQueryDto (요청 쿼리)
```

---

## 핵심 API

| 이름 | 종류 | 용도 |
|---|---|---|
| `paginate()` | 함수 | Prisma 모델의 `findMany` + `count` 를 동시 실행하고 페이지네이션 결과 반환 |
| `OffsetPagination<T>` | interface | 헬퍼가 내부적으로 반환하는 plain 타입 |
| `PaginateOptions<M>` | interface | paginate 함수 옵션. 모델에서 타입 자동 추출 |
| `PaginateDelegate` | interface | paginate가 받는 모델의 구조적 조건 |
| `OffsetPaginationDto<T>` | class (DTO) | Swagger 데코레이터 포함 응답 클래스 |
| `PageInfoDto` | class (DTO) | 페이지 메타 정보 DTO |
| `PaginationQueryDto` | class (DTO) | `page`, `limit` 쿼리 파라미터 DTO (`class-validator` 검증 포함) |

---

## 사용법

### 1. 단순 케이스 (faq, notice, event, terms)

```ts
import { OffsetPaginationDto, paginate } from "@org/api/pagination";
import { Faq } from "@prisma/client";

@Injectable()
export class FaqService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(page: number, limit: number): Promise<OffsetPaginationDto<Faq>> {
        return paginate(this.prisma.faq, {
            page,
            limit,
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
    }
}
```

- `paginate(this.prisma.faq, ...)` 만 호출하면 끝.
- TypeScript가 `T = Faq`를 자동 추론 → 반환 `OffsetPagination<Faq>` (구조상 `OffsetPaginationDto<Faq>` 와 호환).
- `where`, `orderBy` 안에 잘못된 필드를 쓰면 컴파일 에러로 잡힘.

### 2. where 조건 추가 (내 문의 조회)

```ts
async findAllByMemberId(memberId: string, page: number, limit: number): Promise<OffsetPaginationDto<Inquiry>> {
    return paginate(this.prisma.inquiry, {
        page,
        limit,
        where: { memberId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
    });
}
```

### 3. include 사용 (inquiry, pre-registration)

`include`를 쓰면 반환 객체에 join된 필드가 추가됨. 정확한 타입을 위해 `Prisma.XGetPayload<...>` 로 명시:

```ts
import { OffsetPaginationDto, paginate } from "@org/api/pagination";
import { Inquiry, Prisma } from "@prisma/client";

/**
 * @name InquiryWithMember
 * @description 작성자(member) 정보를 포함한 1:1 문의 타입
 */
type InquiryWithMember = Prisma.InquiryGetPayload<{
    include: { member: { select: { name: true; email: true } } };
}>;

@Injectable()
export class InquiryService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(page: number = 1, limit: number = 10): Promise<OffsetPaginationDto<any>> {
        const result = await paginate<typeof this.prisma.inquiry, InquiryWithMember>(this.prisma.inquiry, {
            page,
            limit,
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
                member: { select: { name: true, email: true } },
            },
        });

        return {
            ...result,
            items: result.items.map((inquiry) => ({
                ...inquiry,
                authorName: inquiry.member.name,    // ← Prisma.GetPayload 덕에 타입 안전
                authorEmail: inquiry.member.email,
            })),
        };
    }
}
```

**포인트:**
- `paginate<typeof this.prisma.inquiry, InquiryWithMember>(...)` — 첫 generic은 모델 delegate, 두 번째는 items 타입 override.
- `Prisma.InquiryGetPayload<{ include: {...} }>` 는 Prisma가 자동 생성하는 유틸리티. `include`에 넘기는 args 형태 그대로 넣으면 반환 객체 타입을 계산해줌. schema가 바뀌면 자동으로 따라감.

### 4. 페이지네이션 후 추가 처리 (gallery)

`paginate()`가 반환한 `result`를 받아 후처리:

```ts
async findAll(page: number, limit: number): Promise<OffsetPaginationDto<Gallery & { thumbnailUrl: string | null }>> {
    const result = await paginate(this.prisma.gallery, {
        page,
        limit,
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
    });

    const itemsWithThumbnail = await Promise.all(
        result.items.map(async (gallery) => {
            const firstImage = await this.prisma.attachment.findFirst({
                where: { entityType: 'gallery', entityId: gallery.id },
                orderBy: { sortOrder: 'asc' },
            });
            return { ...gallery, thumbnailUrl: firstImage?.url ?? null };
        })
    );

    return {
        ...result,           // pageInfo는 그대로
        items: itemsWithThumbnail,  // items만 교체
    };
}
```

> ⚠️ gallery는 현재 N+1 패턴 (썸네일을 갤러리당 1쿼리). 추후 단일 쿼리로 묶을 예정.

---

## 타입 추출 원리

`paginate<M, T = ItemOf<M>>` 는 모델 delegate `M` 에서 타입을 자동으로 끌어낸다.

```ts
// 모델 delegate가 가진 findMany 함수의 args 타입을 추출
type FindManyArgs<M extends PaginateDelegate> = NonNullable<Parameters<M['findMany']>[0]>;

// findMany가 반환하는 배열의 요소 타입
type ItemOf<M extends PaginateDelegate> = Awaited<ReturnType<M['findMany']>>[number];

// 옵션 타입은 모델의 args에서 조건부로 추출
export interface PaginateOptions<M extends PaginateDelegate> {
    page: number;
    limit: number;
    where?: FindManyArgs<M> extends { where?: infer W } ? W : never;
    orderBy?: FindManyArgs<M> extends { orderBy?: infer O } ? O : never;
    include?: FindManyArgs<M> extends { include?: infer I } ? I : never;
    select?: FindManyArgs<M> extends { select?: infer S } ? S : never;
}
```

**예시:** `paginate(this.prisma.faq, {...})` 호출 시
- `M` = `typeof prisma.faq`
- `FindManyArgs<M>` = `Prisma.FaqFindManyArgs<DefaultArgs>`
- `where?: Prisma.FaqWhereInput`
- 반환: `OffsetPagination<Faq>`

→ 사용자가 별도로 타입을 명시하지 않아도 모델별로 정확한 타입을 사용할 수 있다.

---

## DTO

DTO들은 Swagger 문서화와 검증을 위해 라이브러리에 포함되어 있다.

### `PageInfoDto`

```ts
{
    page: number;          // 현재 페이지 번호
    limit: number;         // 페이지당 항목 수
    pageItems: number;     // 현재 페이지의 실제 항목 수 (마지막 페이지면 limit보다 작을 수 있음)
    totalItems: number;    // 전체 항목 수
    totalPages: number;    // 전체 페이지 수 (올림)
}
```

### `OffsetPaginationDto<T>`

```ts
{
    items: T[];
    pageInfo: PageInfoDto;
}
```

서비스 메서드 반환 타입으로 사용:
```ts
Promise<OffsetPaginationDto<Faq>>
```

### `PaginationQueryDto`

컨트롤러에서 `@Query()` 와 함께 사용:

```ts
import { PaginationQueryDto } from "@org/api/pagination";

@Get()
findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query.page, query.limit);
}
```

- `page` 기본값 1, 최소 1
- `limit` 기본값 10, 최소 1
- `class-validator` 로 자동 검증

---

## 내부 `any` 에 대한 설명

`PaginateDelegate` 인터페이스에는 `any`가 남아 있다:

```ts
export interface PaginateDelegate {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: (args: any) => Promise<any[]>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count: (args: any) => Promise<number>;
}
```

**왜 `any`?**
- Prisma는 모델마다 args 타입이 다름 (`FaqFindManyArgs`, `NoticeFindManyArgs`, ...). 하나의 구체 타입으로 묶을 수 없음.
- `unknown`으로 바꿔도 TypeScript의 **함수 매개변수 contravariance** 규칙 때문에 실제 Prisma delegate가 이 조건을 만족하지 못함.
- 따라서 구조적 최소 조건으로 `any` 사용이 불가피.

**중요한 점:** `any`는 **인터페이스 정의 내부**에만 있고, **공개 API (`PaginateOptions`)**는 조건부 타입으로 모델별 정확한 타입을 추출함. 호출 측에서는 `any`가 보이지 않으며 완전한 타입 안전성을 가진다.

---

## 리팩토링 히스토리

### Task #1 — 페이지네이션 헬퍼 추출 (2026-05-20)

**Before:** `apps/server` 와 `apps/server-shop` 양쪽의 모든 service `findAll()` 메서드에서 동일한 패턴이 약 25줄씩 반복.

```ts
const skip = (page - 1) * limit;
const [items, totalItems] = await Promise.all([
    this.prisma.faq.findMany({ where: {...}, orderBy: {...}, skip, take: limit }),
    this.prisma.faq.count({ where: {...} }),
]);
return {
    items,
    pageInfo: {
        page, limit,
        pageItems: items.length,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
    },
};
```

**After:**
```ts
return paginate(this.prisma.faq, {
    page, limit,
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
});
```

- 적용 서비스 13개 (server 7 + server-shop 6)
- 보일러플레이트 약 200줄 이상 감소

### Task #2 — 공통 DTO를 libs 로 이동 (2026-05-21)

**Before:** `OffsetPaginationDto`, `PageInfoDto`, `PaginationQueryDto` 가 `apps/server/src/libs/dtos/` 와 `apps/server-shop/src/libs/dtos/` 양쪽에 중복 존재.

**After:**
- DTO 3개를 `libs/api/pagination/src/lib/dtos/` 로 이동 (단일 출처)
- 26개 파일 import 경로 변경: `../../libs/dtos` → `@org/api/pagination`
- 동일 라이브러리에서 import 되는 항목은 한 줄로 통합:
  ```ts
  import { OffsetPaginationDto, paginate } from "@org/api/pagination";
  ```
- 기존 `apps/server/src/libs/dtos/`, `apps/server-shop/src/libs/dtos/` 폴더 삭제

### `paginate` 시그니처 개선 (Task #2 중)

`any`를 명시적 타입으로 교체:
- `PaginateOptions` 의 `where/orderBy/include/select` → 조건부 타입으로 모델 delegate 에서 자동 추출
- 호출 측에서 `paginate<any>(prisma.inquiry, ...)` → `paginate<typeof this.prisma.inquiry, InquiryWithMember>(...)` 로 명시화
- `Prisma.InquiryGetPayload<...>` / `Prisma.PreRegistrationGetPayload<...>` 활용
