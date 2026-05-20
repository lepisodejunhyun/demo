import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OffsetPaginationDto, paginate } from '@org/api/pagination';
import { Event } from '@prisma/client';

@Injectable()
export class EventService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    /**
     * @name findAll
     * @description 행사 전체 조회
     * @param {number} page
     * @param {number} limit
     * @returns {Promise<OffsetPaginationDto<Event>>}
     */
    async findAll(page: number, limit: number): Promise<OffsetPaginationDto<Event>> {
        return paginate(this.prisma.event, {
            page,
            limit,
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * @name findById
     * @description 행사 상세 조회
     * @param {string} id
     * @returns {Promise<Event>}
     */
    async findById(id: string): Promise<Event> {
        const event = await this.prisma.event.findUnique({
            where: { id, deletedAt: null },
        });

        if (!event) throw new NotFoundException('행사 정보를 찾을 수 없습니다.');

        return event;
    }
}
