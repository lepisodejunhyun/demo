import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OffsetPaginationDto, paginate } from "@org/api/pagination";
import { PreRegistration, Prisma } from "@prisma/client";
import { CreatePreRegistrationDto } from "./dtos/create-pre-registration.dto";
import { UpdatePreRegistrationDto } from "./dtos/update-pre-registration.dto";
import { EventService } from "../event/event.service";

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

/**
 * @name PreRegistrationListItem
 * @description 목록 조회용 타입 (행사명/회원명 평탄화 포함)
 */
type PreRegistrationListItem = PreRegistrationWithEventMember & {
    eventTitle: string;
    memberName: string | null;
};

/**
 * @name PreRegistrationDetail
 * @description 상세 조회용 타입 (행사명/회원명 + 약관 동의 내역 포함)
 */
type PreRegistrationDetail = PreRegistrationWithEventMember & {
    eventTitle: string;
    memberName: string | null;
    agreements: {
        termsId: string;
        termsTitle: string;
        isRequired: boolean;
        agreedAt: Date;
    }[];
};

@Injectable()
export class PreRegistrationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly eventService: EventService,
    ) { }

    /**
     * @name create
     * @description 사전 등록 신규 생성.
     *              행사 검증: 존재 + 사전 등록 기간 설정 + 기간 내
     * @param {CreatePreRegistrationDto} data
     * @returns {Promise<PreRegistration>}
     */
    async create(data: CreatePreRegistrationDto): Promise<PreRegistration> {
        await this.eventService.assertEventAvailable(data.eventId);

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
     * @name findAll
     * @description 사전 등록 페이지네이션 조회 (행사명, 회원명 평탄화)
     * @param {number} page - 페이지 번호 (기본값: 1)
     * @param {number} limit - 페이지당 항목 수 (기본값: 10)
     * @returns {Promise<OffsetPaginationDto<PreRegistrationListItem>>}
     */
    async findAll(page: number, limit: number): Promise<OffsetPaginationDto<PreRegistrationListItem>> {
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
     * @returns {Promise<PreRegistrationDetail>}
     */
    async findById(id: string): Promise<PreRegistrationDetail> {
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
     * @name update
     * @description 사전 등록 수정. 신청자 정보만 변경 가능 (행사/회원 변경 불가).
     * @param {string} id
     * @param {UpdatePreRegistrationDto} data
     * @returns {Promise<PreRegistration>}
     */
    async update(id: string, data: UpdatePreRegistrationDto): Promise<PreRegistration> {
        await this.assertExists(id);

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
        await this.assertExists(id);

        return this.prisma.preRegistration.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }

    /**
     * @name assertExists
     * @description 사전 등록 존재 여부 확인. 존재하지 않으면 NotFoundException 던짐.
     * @param {string} id
     */
    private async assertExists(id: string): Promise<void> {
        const exists = await this.prisma.preRegistration.findFirst({
            where: { id, deletedAt: null },
            select: { id: true },
        });
        if (!exists) throw new NotFoundException('사전 등록 내역을 찾을 수 없습니다.');
    }
}
