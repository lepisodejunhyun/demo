import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Notice } from "@prisma/client";
import { CreateNoticeDto } from "./dtos/create-notice.dto";
import { OffsetPaginationDto, paginate } from "@org/api/pagination";

@Injectable()
export class NoticeService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    /**
     * @name create
     * @description 공지사항 신규 등록
     * @param {CreateNoticeDto} data
     * @returns {Promise<Notice>}
     */
    async create(data: CreateNoticeDto): Promise<Notice> {
        const { title, content } = data;

        const notice = await this.prisma.notice.create({
            data: {
                title: title,
                content: content,
            },
        });

        return notice;
    }

    /**
     * @name findAll
     * @description 공지사항 페이지네이션 조회
     * @param {number} page - 페이지 번호 (기본값: 1)
     * @param {number} limit - 페이지당 항목 수 (기본값: 10)
     * @return {Promise<OffsetPaginationDto<Notice>>}
     */
    async findAll(page: number = 1, limit: number = 10): Promise<OffsetPaginationDto<Notice>> {
        return paginate(this.prisma.notice, {
            page,
            limit,
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * @name findById
     * @description 공지사항 상세 조회
     * @param {string} id
     * @returns {Promise<Notice>}
     */
    async findById(id: string): Promise<Notice> {
        const notice = await this.prisma.notice.findFirst({
            where: {
                id: id,
                deletedAt: null,
            }
        });

        if (!notice) throw new NotFoundException('공지사항을 찾을 수 없습니다.');

        return notice;
    }

    /**
     * @name update
     * @description 공지사항 수정
     * @param {string} id
     * @param {CreateNoticeDto} data
     * @returns {Promise<Notice>}
     */
    async update(id: string, data: CreateNoticeDto): Promise<Notice> {
        await this.assertExists(id);

        const { title, content } = data;

        const notice = await this.prisma.notice.update({
            where: {
                id: id,
            },
            data: {
                title: title,
                content: content,
            }
        });

        return notice;
    }

    /**
     * @name remove
     * @description 공지사항 삭제 (Soft Delete)
     * @param {string} id
     * @returns {Promise<Notice>}
     */
    async remove(id: string): Promise<Notice> {
        const notice = await this.prisma.notice.update({
            where: { id: id },
            data: { deletedAt: new Date() },
        });

        return notice;
    }

    /**
     * @name assertExists
     * @description 공지사항 존재 여부 확인. 존재하지 않으면 NotFoundException 던짐.
     * @param {string} id
     */
    private async assertExists(id: string): Promise<void> {
        const exists = await this.prisma.notice.findFirst({
            where: { id, deletedAt: null },
            select: { id: true },
        });
        if (!exists) throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }
}