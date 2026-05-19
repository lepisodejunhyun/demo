import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OffsetPaginationDto } from "../../libs/dtos";
import { Inquiry } from "@prisma/client";
import { UpdateInquiryDto } from "./dtos/update-inquiry.dto";

@Injectable()
export class InquiryService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    /**
     * @name findAll
     * @description 1:1 문의 페이지네이션 조회 (작성자 정보 포함)
     * @param {number} page - 페이지 번호 (기본값: 1)
     * @param {number} limit - 페이지당 항목 수 (기본값: 10)
     * @returns {Promise<OffsetPaginationDto<any>>}
     */
    async findAll(page: number = 1, limit: number = 10): Promise<OffsetPaginationDto<any>> {
        const skip = (page - 1) * limit;

        const [items, totalItems] = await Promise.all([
            this.prisma.inquiry.findMany({
                where: {
                    deletedAt: null,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
                include: {
                    member: { select: { name: true, email: true } },
                },
            }),
            this.prisma.inquiry.count({
                where: {
                    deletedAt: null,
                },
            }),
        ]);

        const flattenedItems = items.map((inquiry) => ({
            ...inquiry,
            authorName: inquiry.member.name,
            authorEmail: inquiry.member.email,
        }));

        return {
            items: flattenedItems,
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
     * @description 1:1 문의 상세 조회 (작성자 + 첨부 이미지 포함)
     * @param {string} id
     * @returns {Promise<any>}
     */
    async findById(id: string): Promise<any> {
        const inquiry = await this.prisma.inquiry.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                member: { select: { name: true, email: true } },
            },
        });

        if (!inquiry) throw new NotFoundException('1:1 문의를 찾을 수 없습니다.');

        const images = await this.prisma.attachment.findMany({
            where: {
                entityType: 'inquiry',
                entityId: id,
            },
            orderBy: {
                sortOrder: 'asc',
            },
        });

        return {
            ...inquiry,
            authorName: inquiry.member.name,
            authorEmail: inquiry.member.email,
            images,
        };
    }

    /**
     * @name update
     * @description 1:1 문의 답변 작성/수정. 답변 저장 시 자동으로 상태를 COMPLETED로 변경.
     * @param {string} id
     * @param {UpdateInquiryDto} data - { answer }
     * @returns {Promise<any>} 갱신된 문의 상세 (작성자 + 이미지 포함)
     */
    async update(id: string, data: UpdateInquiryDto): Promise<any> {
        await this.findById(id);

        const inquiry = await this.prisma.inquiry.update({
            where: { id },
            data: {
                answer: data.answer,
                status: 'COMPLETED',
                answeredAt: new Date(),
            },
        });

        return inquiry;
    }

    /**
     * @name remove
     * @description 1:1 문의 삭제 (Soft Delete)
     * @param {string} id
     * @returns {Promise<Inquiry>}
     */
    async remove(id: string): Promise<Inquiry> {
        await this.findById(id);

        const inquiry = await this.prisma.inquiry.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });

        return inquiry;
    }
}
