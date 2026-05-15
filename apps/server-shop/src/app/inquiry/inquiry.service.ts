import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OffsetPaginationDTO } from '../../libs/dtos';
import { Inquiry } from '@prisma/client';

@Injectable()
export class InquiryService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    /**
     * @name findAllByMemberId
     * @description 내 1:1 문의 전체 조회
     * @param {string} memberId
     * @param {number} page
     * @param {number} limit
     * @returns {Promise<OffsetPaginationDTO<Inquiry>>}
     */
    async findAllByMemberId(memberId: string, page: number, limit: number): Promise<OffsetPaginationDTO<Inquiry>> {
        const skip = (page - 1) * limit;

        const [items, totalItems] = await Promise.all([
            this.prisma.inquiry.findMany({
                where: { memberId, deletedAt: null },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.inquiry.count({
                where: { memberId, deletedAt: null },
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
     * @name findByIdAndMemberId
     * @description 내 1:1 문의 상세 조회
     * @param {string} id
     * @param {string} memberId
     * @returns {Promise<Inquiry>}
     */
    async findByIdAndMemberId(id: string, memberId: string): Promise<Inquiry> {
        const inquiry = await this.prisma.inquiry.findFirst({
            where: { id, memberId, deletedAt: null },
        });

        if (!inquiry) throw new NotFoundException('문의 내역을 찾을 수 없거나 권한이 없습니다.');

        return inquiry;
    }

    /**
     * @name create
     * @description 1:1 문의 작성
     * @param {string} memberId
     * @param {string} title
     * @param {string} content
     * @returns {Promise<Inquiry>}
     */
    async create(memberId: string, title: string, content: string): Promise<Inquiry> {
        return this.prisma.inquiry.create({
            data: {
                memberId,
                title,
                content,
                status: 'PENDING',
            },
        });
    }
}
