import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OffsetPaginationDto, paginate } from "@org/api/pagination";
import { Event } from "@prisma/client";
import { CreateEventDto } from "./dtos/create-event.dto";

@Injectable()
export class EventService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    /**
     * @name create
     * @description 행사 정보 등록
     * @param {CreateEventDto} data
     * @returns {Promise<Event>}
     */
    async create(data: CreateEventDto): Promise<Event> {
        this.validateDates(data);

        const event = await this.prisma.event.create({
            data
        });

        return event;
    }

    /**
     * @name findAll
     * @description 행사 페이지네이션 조회
     * @param {number} page - 페이지 번호 (기본값: 1)
     * @param {number} limit - 페이지당 항목 수 (기본값: 10)
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
     * @description 사전 등록 가능한 행사 목록 조회.
     *              조건: preRegStartDate/preRegEndDate가 설정되어 있고,
     *                    현재 시각이 해당 기간 내인 행사.
     * @returns {Promise<Event[]>}
     */
    async findAvailableEvents(): Promise<Event[]> {
        const now = new Date();

        return this.prisma.event.findMany({
            where: {
                deletedAt: null,
                preRegStartDate: { not: null, lte: now },
                preRegEndDate: { not: null, gte: now },
            },
            orderBy: {
                preRegEndDate: 'asc',
            },
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
            where: {
                id,
                deletedAt: null,
            }
        });

        if (!event) throw new NotFoundException('행사 정보를 찾을 수 없습니다.');

        return event;
    }

    /**
     * @name update
     * @description 행사 정보 수정
     * @param {string} id
     * @param {CreateEventDto} data
     * @returns {Promise<Event>}
     */
    async update(id: string, data: CreateEventDto): Promise<Event> {
        await this.assertExists(id);
        this.validateDates(data);

        const event = await this.prisma.event.update({
            where: {
                id,
            },
            data
        });

        return event;
    }

    /**
     * @name remove
     * @description 행사 삭제
     * @param {string} id
     * @returns {Promise<Event>}
     */
    async remove(id: string): Promise<Event> {
        const event = await this.prisma.event.update({
            where: {
                id,
            },
            data: {
                deletedAt: new Date(),
            },
        });

        return event;
    }

    /**
     * @name assertExists
     * @description 행사 존재 여부 확인. 존재하지 않으면 NotFoundException 던짐.
     * @param {string} id
     */
    private async assertExists(id: string): Promise<void> {
        const exists = await this.prisma.event.findFirst({
            where: { id, deletedAt: null },
            select: { id: true },
        });
        if (!exists) throw new NotFoundException('행사 정보를 찾을 수 없습니다.');
    }

    /**
     * @name validateDates
     * @description 행사 날짜 유효성 검증 (시작일/종료일, 사전 등록 기간)
     * @param {CreateEventDto} data
     */
    private validateDates(data: CreateEventDto): void {
        if (data.endDate <= data.startDate) {
            throw new BadRequestException('종료일은 시작일 이후여야 합니다.');
        }

        if (data.preRegEndDate) {
            if (data.preRegStartDate && data.preRegEndDate < data.preRegStartDate) {
                throw new BadRequestException('사전 등록 종료일은 시작일 이후여야 합니다.');
            }
            if (data.preRegEndDate > data.startDate) {
                throw new BadRequestException('사전 등록 종료일은 행사 시작일 이전이어야 합니다.');
            }
        }
    }

    /**
     * @name assertEventAvailable
     * @description 행사가 존재하고 사전 등록 가능한 상태인지 검증.
     *              실패 시 NotFoundException 또는 BadRequestException 던짐.
     * @param {string} eventId
     */
    async assertEventAvailable(eventId: string): Promise<void> {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, deletedAt: null },
        });

        if (!event) {
            throw new NotFoundException('행사를 찾을 수 없습니다.');
        }

        if (!event.preRegStartDate || !event.preRegEndDate) {
            throw new BadRequestException('사전 등록 기간이 설정되지 않은 행사입니다.');
        }

        const now = new Date();
        const preRegDeadline = new Date(event.preRegEndDate);
        preRegDeadline.setDate(preRegDeadline.getDate() + 1);

        if (now < event.preRegStartDate || now >= preRegDeadline) {
            throw new BadRequestException('사전 등록 가능 기간이 아닙니다.');
        }
    }

}