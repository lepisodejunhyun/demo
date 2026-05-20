import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OffsetPaginationDto } from "../../libs/dtos";
import { Terms } from "@prisma/client";
import { CreateTermsDto } from "./dtos/create-terms.dto";

@Injectable()
export class TermsService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    /**
     * @name findAll
     * @description 약관 페이지네이션 조회
     * @param {number} page - 페이지 번호 (기본값: 1)
     * @param {number} limit - 페이지당 항목 수 (기본값: 10)
     * @returns {Promise<OffsetPaginationDto<Terms>>}
     */
    async findAll(page: number = 1, limit: number = 10): Promise<OffsetPaginationDto<Terms>> {
        const skip = (page - 1) * limit;

        const [items, totalItems] = await Promise.all([
            this.prisma.terms.findMany({
                where: {
                    deletedAt: null,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.terms.count({
                where: {
                    deletedAt: null,
                },
            }),
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
    }

    /**
     * @name findById
     * @description 약관 상세 조회
     * @param {string} id
     * @returns {Promise<Terms>}
     */
    async findById(id: string): Promise<Terms> {
        const terms = await this.prisma.terms.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });

        if (!terms) throw new NotFoundException('약관을 찾을 수 없습니다.');

        return terms;
    }

    /**
     * @name create
     * @description 약관 신규 등록
     * @param {CreateTermsDto} data
     * @returns {Promise<Terms>}
     */
    async create(data: CreateTermsDto): Promise<Terms> {
        return this.prisma.terms.create({ data });
    }

    /**
     * @name update
     * @description 약관 수정
     * @param {string} id
     * @param {CreateTermsDto} data
     * @returns {Promise<Terms>}
     */
    async update(id: string, data: CreateTermsDto): Promise<Terms> {
        await this.findById(id);

        return this.prisma.terms.update({
            where: { id },
            data,
        });
    }

    /**
     * @name remove
     * @description 약관 삭제 (Soft Delete)
     * @param {string} id
     * @returns {Promise<Terms>}
     */
    async remove(id: string): Promise<Terms> {
        await this.findById(id);

        return this.prisma.terms.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }
}
