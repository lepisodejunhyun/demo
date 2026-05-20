import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OffsetPaginationDto, paginate } from '@org/api/pagination';
import { Notice } from '@prisma/client';

@Injectable()
export class NoticeService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    /**
     * @name findAll
     * @description 공지사항 전체 조회
     * @param {number} page
     * @param {number} limit
     * @returns {Promise<OffsetPaginationDto<Notice>>}
     */
    async findAll(page: number, limit: number): Promise<OffsetPaginationDto<Notice>> {
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
        const notice = await this.prisma.notice.findUnique({
            where: { id, deletedAt: null },
        });

        if (!notice) throw new NotFoundException('공지사항 정보를 찾을 수 없습니다.');

        return notice;
    }
}
