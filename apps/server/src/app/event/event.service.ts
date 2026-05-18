import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OffsetPaginationDTO } from "../../libs/dtos";
import { Event } from "@prisma/client";
import { EventCreateDTO } from "./dtos/event-create.dto";

@Injectable()
export class EventService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    /**
     * @name findAll
     * @description 행사 페이지네이션 조회
     * @param {number} page - 페이지 번호 (기본값: 1)
     * @param {number} limit - 페이지당 항목 수 (기본값: 10)
     * @returns {Promise<OffsetPaginationDTO<Event>>}
     */
    async findAll(page: number, limit: number, search?: string | null): Promise<OffsetPaginationDTO<Event>> {
        const skip = (page - 1) * limit;

        const [items, totalItems] = await Promise.all([
            this.prisma.event.findMany({
                where: {
                    deletedAt: null,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.event.count({
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
     * @name create
     * @description 행사 정보 등록
     * @param {EventCreateDTO} data
     * @returns {Promise<Event>}
     */
    async create(data: EventCreateDTO): Promise<Event> {
        this.validateDates(data);

        const event = await this.prisma.event.create({
            data
        });

        return event;
    }

    /**
     * @name update
     * @description 행사 정보 수정
     * @param {string} id
     * @param {EventCreateDTO} data
     * @returns {Promise<Event>}
     */
    async update(id: string, data: EventCreateDTO): Promise<Event> {
        await this.findById(id);
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
     * @name validateDates
     * @description 행사 날짜 유효성 검증 (시작일/종료일, 사전 등록 기간)
     * @param {EventCreateDTO} data
     */
    private validateDates(data: EventCreateDTO): void {
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

}