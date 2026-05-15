import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OffsetPaginationDTO } from "../../libs/dtos";
import { Event, PreRegistration } from "@prisma/client";
import { PreRegistrationCreateDTO } from "./dtos/pre-registration-create.dto";
import { PreRegistrationUpdateDTO } from "./dtos/pre-registration-update.dto";

@Injectable()
export class PreRegistrationService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    /**
     * @name findAll
     * @description 사전 등록 페이지네이션 조회 (행사명/회원명 평탄화)
     * @param {number} page - 페이지 번호 (기본값: 1)
     * @param {number} limit - 페이지당 항목 수 (기본값: 10)
     * @returns {Promise<OffsetPaginationDTO<any>>}
     */
    async findAll(page: number = 1, limit: number = 10): Promise<OffsetPaginationDTO<any>> {
        const skip = (page - 1) * limit;

        const [items, totalItems] = await Promise.all([
            this.prisma.preRegistration.findMany({
                where: {
                    deletedAt: null,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
                include: {
                    event: { select: { title: true } },
                    member: { select: { name: true } },
                },
            }),
            this.prisma.preRegistration.count({
                where: {
                    deletedAt: null,
                },
            }),
        ]);

        // 행사명/회원명을 평탄화하여 응답
        const flattenedItems = items.map((item) => ({
            ...item,
            eventTitle: item.event.title,
            memberName: item.member?.name ?? null,
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
     * @description 사전 등록 상세 조회
     * @param {string} id
     * @returns {Promise<any>}
     */
    async findById(id: string): Promise<any> {
        const item = await this.prisma.preRegistration.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                event: { select: { title: true } },
                member: { select: { name: true } },
            },
        });

        if (!item) throw new NotFoundException('사전 등록 내역을 찾을 수 없습니다.');

        return {
            ...item,
            eventTitle: item.event.title,
            memberName: item.member?.name ?? null,
        };
    }

    /**
     * @name findAvailableEvents
     * @description 사전 등록 가능한 행사 목록 조회.
     *              조건: preRegStartDate/preRegEndDate가 설정되어 있고,
     *                    현재 시각이 그 기간 내인 행사.
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
     * @name create
     * @description 사전 등록 신규 생성.
     *              행사 검증: 존재 + 사전 등록 기간 설정 + 기간 내.
     * @param {PreRegistrationCreateDTO} data
     * @returns {Promise<PreRegistration>}
     */
    async create(data: PreRegistrationCreateDTO): Promise<PreRegistration> {
        // 행사 존재 + 사전 등록 가용 여부 검증
        await this.assertEventAvailable(data.eventId);

        // 회원 id가 들어왔다면 존재 확인
        if (data.memberId) {
            const member = await this.prisma.member.findFirst({
                where: { id: data.memberId, deletedAt: null },
            });
            if (!member) throw new NotFoundException('회원을 찾을 수 없습니다.');
        }

        return this.prisma.preRegistration.create({
            data: {
                eventId: data.eventId,
                memberId: data.memberId ?? null,
                applicantName: data.applicantName,
                contactNumber: data.contactNumber,

            },
        });
    }

    /**
     * @name update
     * @description 사전 등록 수정. 신청자 정보만 변경 가능 (행사/회원 변경 불가).
     * @param {string} id
     * @param {PreRegistrationUpdateDTO} data
     * @returns {Promise<PreRegistration>}
     */
    async update(id: string, data: PreRegistrationUpdateDTO): Promise<PreRegistration> {
        await this.findById(id);

        return this.prisma.preRegistration.update({
            where: { id },
            data: {
                applicantName: data.applicantName,
                contactNumber: data.contactNumber,

            },
        });
    }

    /**
     * @name remove
     * @description 사전 등록 삭제 (Soft Delete)
     * @param {string} id
     * @returns {Promise<PreRegistration>}
     */
    async remove(id: string): Promise<PreRegistration> {
        await this.findById(id);

        return this.prisma.preRegistration.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }

    /**
     * 행사가 존재하고 사전 등록 가능한 상태인지 검증.
     * 실패 시 NotFoundException 또는 BadRequestException 던짐.
     */
    private async assertEventAvailable(eventId: string): Promise<void> {
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
        if (now < event.preRegStartDate || now > event.preRegEndDate) {
            throw new BadRequestException('사전 등록 가능 기간이 아닙니다.');
        }
    }
}
