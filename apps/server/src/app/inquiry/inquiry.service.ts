import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OffsetPaginationDTO } from "../../libs/dtos";
import { Inquiry } from "@prisma/client";
import { InquiryAnswerDTO } from "./dtos/inquiry-answer.dto";

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
     * @returns {Promise<OffsetPaginationDTO<any>>}
     */
    async findAll(page: number = 1, limit: number = 10): Promise<OffsetPaginationDTO<any>> {
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

        // 작성자 정보를 평탄화 (member 객체 → authorName/authorEmail)
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
     * @name updateAnswer
     * @description 1:1 문의 답변 작성/수정 (옵션으로 상태 함께 변경)
     * @param {string} id
     * @param {InquiryAnswerDTO} data - { answer, status? }
     * @returns {Promise<any>} 갱신된 문의 상세 (작성자 + 이미지 포함)
     */
    async updateAnswer(id: string, data: InquiryAnswerDTO): Promise<any> {
        await this.findById(id);

        await this.prisma.inquiry.update({
            where: { id },
            data: {
                answer: data.answer,
                answeredAt: new Date(),
                ...(data.status && { status: data.status }),
            },
        });

        // 응답 일관성을 위해 갱신된 데이터(작성자 + 이미지 포함) 다시 조회
        return this.findById(id);
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
