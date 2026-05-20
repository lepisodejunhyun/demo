import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OffsetPaginationDto } from "../../libs/dtos";
import { Faq } from "@prisma/client";

@Injectable()
export class FaqService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    /**
     * @name findAll
     * @description FAQ 페이지네이션 조회
     * @param {number} page - 페이지 번호
     * @param {number} limit - 페이지당 항목 수
     * @returns {Promise<OffsetPaginationDto<Faq>>}
     */
    async findAll(page: number, limit: number): Promise<OffsetPaginationDto<Faq>> {
        const skip = (page - 1) * limit;

        const [items, totalItems] = await Promise.all([
            this.prisma.faq.findMany({
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.faq.count({
                where: { deletedAt: null },
            })
        ]);

        return {
            items,
            pageInfo: {
                page,
                limit,
                pageItems: items.length,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
            }
        };

    }

    /**
     * @name findById
     * @description FAQ 상세 조회
     * @param {string} id
     * @returns {Promise<Faq>}
     */
    async findById(id: string): Promise<Faq> {
        const faq = await this.prisma.faq.findUnique({
            where: {
                id,
                deletedAt: null,
            }
        });

        if (!faq) throw new NotFoundException('FAQ 정보를 찾을 수 없습니다.');

        return faq;
        ``
    }
}