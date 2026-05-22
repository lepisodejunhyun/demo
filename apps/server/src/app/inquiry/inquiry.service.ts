import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OffsetPaginationDto, paginate } from "@org/api/pagination";
import { Attachment, Inquiry, Prisma } from "@prisma/client";
import { UpdateInquiryDto } from "./dtos/update-inquiry.dto";

/**
 * @name InquiryWithMember
 * @description 작성자(member) 정보를 포함한 1:1 문의 타입
 */
type InquiryWithMember = Prisma.InquiryGetPayload<{
    include: { member: { select: { name: true; email: true } } };
}>;

/**
 * @name InquiryListItem
 * @description 목록 조회용 타입 (작성자명/이메일 평탄화 포함)
 */
type InquiryListItem = InquiryWithMember & {
    authorName: string;
    authorEmail: string;
};

/**
 * @name InquiryDetail
 * @description 상세 조회용 타입 (작성자 + 첨부 이미지 포함)
 */
type InquiryDetail = InquiryWithMember & {
    authorName: string;
    authorEmail: string;
    images: Attachment[];
};

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
     * @returns {Promise<OffsetPaginationDto<InquiryListItem>>}
     */
    async findAll(page: number = 1, limit: number = 10): Promise<OffsetPaginationDto<InquiryListItem>> {
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
                authorName: inquiry.member.name,
                authorEmail: inquiry.member.email,
            })),
        };
    }

    /**
     * @name findById
     * @description 1:1 문의 상세 조회 (작성자 + 첨부 이미지 포함)
     * @param {string} id
     * @returns {Promise<InquiryDetail>}
     */
    async findById(id: string): Promise<InquiryDetail> {
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
     * @returns {Promise<Inquiry>} 갱신된 문의
     */
    async update(id: string, data: UpdateInquiryDto): Promise<Inquiry> {
        await this.assertExists(id);

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
        await this.assertExists(id);

        const inquiry = await this.prisma.inquiry.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });

        return inquiry;
    }

    /**
     * @name assertExists
     * @description 1:1 문의 존재 여부 확인. 존재하지 않으면 NotFoundException 던짐.
     * @param {string} id
     */
    private async assertExists(id: string): Promise<void> {
        const exists = await this.prisma.inquiry.findFirst({
            where: { id, deletedAt: null },
            select: { id: true },
        });
        if (!exists) throw new NotFoundException('1:1 문의를 찾을 수 없습니다.');
    }
}
