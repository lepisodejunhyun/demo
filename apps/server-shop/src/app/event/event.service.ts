import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
     * @name findAvailableEvents
     * @description 사전 등록 가능한 행사 목록 조회 (페이지네이션)
     *              조건: preRegStartDate/preRegEndDate가 설정되어 있고, 현재 시각이 해당 기간 내인 행사
     * @param {number} page
     * @param {number} limit
     * @returns {Promise<OffsetPaginationDto<Event>>}
     */
    async findAvailableEvents(page: number, limit: number): Promise<OffsetPaginationDto<Event>> {
        const now = new Date();

        return paginate(this.prisma.event, {
            page,
            limit,
            where: {
                deletedAt: null,
                preRegStartDate: { not: null, lte: now },
                preRegEndDate: { not: null, gte: now },
            },
            orderBy: { preRegEndDate: 'asc' },
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

    /**
     * @name assertEventAvailable
     * @description 행사 존재 + 사전등록 기간 검증
     * @param {string} eventId
     */
    async assertEventAvailable(eventId: string): Promise<void> {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, deletedAt: null },
        });

        if (!event) throw new NotFoundException('행사를 찾을 수 없습니다.');

        if (!event.preRegStartDate || !event.preRegEndDate) {
            throw new BadRequestException('이 행사는 사전 등록을 지원하지 않습니다.');
        }

        const now = new Date();
        if (now < event.preRegStartDate || now > event.preRegEndDate) {
            throw new BadRequestException('사전 등록 기간이 아닙니다.');
        }
    }
}
