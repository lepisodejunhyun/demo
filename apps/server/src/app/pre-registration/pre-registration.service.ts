import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OffsetPaginationDto, paginate } from "@org/api/pagination";
import { Event, PreRegistration, Prisma } from "@prisma/client";
import { CreatePreRegistrationDto } from "./dtos/create-pre-registration.dto";
import { UpdatePreRegistrationDto } from "./dtos/update-pre-registration.dto";

/**
 * @name PreRegistrationWithEventMember
 * @description 행사(title) + 회원(name) 정보를 포함한 사전 등록 타입
 */
type PreRegistrationWithEventMember = Prisma.PreRegistrationGetPayload<{
    include: {
        event: { select: { title: true } };
        member: { select: { name: true } };
    };
}>;

@Injectable()
export class PreRegistrationService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    /**
     * @name findAll
     * @description 사전 등록 페이지네이션 조회 (행사명, 회원명 평탄화)
     * @param {number} page - 페이지 번호 (기본값: 1)
     * @param {number} limit - 페이지당 항목 수 (기본값: 10)
     * @returns {Promise<OffsetPaginationDto<any>>}
     */
    async findAll(page: number = 1, limit: number = 10): Promise<OffsetPaginationDto<any>> {
        const result = await paginate<typeof this.prisma.preRegistration, PreRegistrationWithEventMember>(this.prisma.preRegistration, {
            page,
            limit,
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
                event: { select: { title: true } },
                member: { select: { name: true } },
            },
        });

        return {
            ...result,
            items: result.items.map((item) => ({
                ...item,
                eventTitle: item.event.title,
                memberName: item.member?.name ?? null,
            })),
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
                agreements: {
                    include: { terms: { select: { title: true, isRequired: true } } },
                    orderBy: { agreedAt: 'asc' },
                },
            },
        });

        if (!item) throw new NotFoundException('사전 등록 내역을 찾을 수 없습니다.');

        return {
            ...item,
            eventTitle: item.event.title,
            memberName: item.member?.name ?? null,
            agreements: item.agreements.map(a => ({
                termsId: a.termsId,
                termsTitle: a.terms.title,
                isRequired: a.terms.isRequired,
                agreedAt: a.agreedAt,
            })),
        };
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
     * @name create
     * @description 사전 등록 신규 생성.
     *              행사 검증: 존재 + 사전 등록 기간 설정 + 기간 내
     * @param {CreatePreRegistrationDto} data
     * @returns {Promise<PreRegistration>}
     */
    async create(data: CreatePreRegistrationDto): Promise<PreRegistration> {
        await this.assertEventAvailable(data.eventId);

        if (data.memberId) {
            const member = await this.prisma.member.findFirst({
                where: { id: data.memberId, deletedAt: null },
            });
            if (!member) throw new NotFoundException('회원을 찾을 수 없습니다.');
        }

        const agreedTermsIds = data.agreedTermsIds ?? [];
        const requiredTerms = await this.prisma.terms.findMany({
            where: { isRequired: true, deletedAt: null },
            select: { id: true, title: true },
        });

        const missingTerms = requiredTerms.filter(t => !agreedTermsIds.includes(t.id));
        if (missingTerms.length > 0) {
            const names = missingTerms.map(t => t.title).join(', ');
            throw new BadRequestException(`필수 약관에 동의해주세요: ${names}`);
        }

        return this.prisma.preRegistration.create({
            data: {
                eventId: data.eventId,
                memberId: data.memberId ?? null,
                applicantName: data.applicantName,
                contactNumber: data.contactNumber,
                agreements: agreedTermsIds.length > 0 ? {
                    create: agreedTermsIds.map(termsId => ({ termsId })),
                } : undefined,
            },
        });
    }

    /**
     * @name update
     * @description 사전 등록 수정. 신청자 정보만 변경 가능 (행사/회원 변경 불가).
     * @param {string} id
     * @param {UpdatePreRegistrationDto} data
     * @returns {Promise<PreRegistration>}
     */
    async update(id: string, data: UpdatePreRegistrationDto): Promise<PreRegistration> {
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
     * @name assertEventAvailable
     * @description 행사가 존재하고 사전 등록 가능한 상태인지 검증.
     *              실패 시 NotFoundException 또는 BadRequestException 던짐.
     * @param {string} eventId
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
        const preRegDeadline = new Date(event.preRegEndDate);
        preRegDeadline.setDate(preRegDeadline.getDate() + 1);

        if (now < event.preRegStartDate || now >= preRegDeadline) {
            throw new BadRequestException('사전 등록 가능 기간이 아닙니다.');
        }
    }
}
