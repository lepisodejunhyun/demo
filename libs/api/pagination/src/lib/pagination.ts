/**
 * @name PageInfo
 * @description 페이지네이션 메타 정보
 */
export interface PageInfo {
    page: number;
    limit: number;
    pageItems: number;
    totalItems: number;
    totalPages: number;
}

/**
 * @name OffsetPagination
 * @description 오프셋 페이지네이션 결과 구조
 */
export interface OffsetPagination<T> {
    items: T[];
    pageInfo: PageInfo;
}

/**
 * @name PaginateDelegate
 * @description paginate 가 요구하는 Prisma 모델 delegate 최소 형태.
 *              prisma.faq, prisma.notice 등 모든 Prisma 모델이 이 형태를 만족한다.
 *
 *              args 가 any 인 이유: Prisma 는 모델마다 서로 다른 args 타입을 가져
 *              (FaqFindManyArgs, NoticeFindManyArgs 등) 하나의 구체 타입으로 묶을 수 없다.
 *              호출 측 타입 안전성은 PaginateOptions 의 조건부 타입으로 모델별 타입을 정확히 추출하므로 확보된다.
 */
export interface PaginateDelegate {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: (args: any) => Promise<any[]>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count: (args: any) => Promise<number>;
}

/**
 * @name FindManyArgs
 * @description Prisma 모델 delegate 의 findMany 함수가 받는 args 타입
 */
type FindManyArgs<M extends PaginateDelegate> = NonNullable<Parameters<M['findMany']>[0]>;

/**
 * @name ItemOf
 * @description Prisma 모델 delegate 의 findMany 반환 배열 요소 타입
 */
type ItemOf<M extends PaginateDelegate> = Awaited<ReturnType<M['findMany']>>[number];

/**
 * @name PaginateOptions
 * @description paginate 함수 옵션. where/orderBy/include/select 타입은 모델 delegate 로부터 자동 추출된다.
 */
export interface PaginateOptions<M extends PaginateDelegate> {
    page: number;
    limit: number;
    where?: FindManyArgs<M> extends { where?: infer W } ? W : never;
    orderBy?: FindManyArgs<M> extends { orderBy?: infer O } ? O : never;
    include?: FindManyArgs<M> extends { include?: infer I } ? I : never;
    select?: FindManyArgs<M> extends { select?: infer S } ? S : never;
}

/**
 * @name paginate
 * @description Prisma 모델의 findMany + count 를 동시에 실행해 오프셋 페이지네이션 결과를 반환한다.
 *              T 타입 인자로 반환 items 의 타입을 override 할 수 있다 (include 사용 시 Prisma.XGetPayload<...> 권장).
 * @param {M} model - Prisma 모델 delegate (예: prisma.faq)
 * @param {PaginateOptions<M>} options - 페이지 옵션 (page, limit, where, orderBy, include, select)
 * @returns {Promise<OffsetPagination<T>>}
 */
export async function paginate<M extends PaginateDelegate, T = ItemOf<M>>(
    model: M,
    options: PaginateOptions<M>,
): Promise<OffsetPagination<T>> {
    const { page, limit, where, orderBy, include, select } = options;
    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
        model.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            ...(include ? { include } : {}),
            ...(select ? { select } : {}),
        }),
        model.count({ where }),
    ]);

    return {
        items: items as T[],
        pageInfo: {
            page,
            limit,
            pageItems: items.length,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
        },
    };
}
