import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePreRegistrationDto } from './dtos/create-pre-registration.dto';
import { Event, PreRegistration } from '@prisma/client';
import { OffsetPaginationDto } from '../../libs/dtos';

@Injectable()
export class PreRegistrationService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

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
        const skip = (page - 1) * limit;

        const where = {
            deletedAt: null,
            preRegStartDate: { not: null, lte: now } as any,
            preRegEndDate: { not: null, gte: now } as any,
        };

        const [items, totalItems] = await Promise.all([
            this.prisma.event.findMany({
                where,
                orderBy: { preRegEndDate: 'asc' as const },
                skip,
                take: limit,
            }),
            this.prisma.event.count({ where }),
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
     * @name create
     * @description 사전 등록 생성 (비회원 허용)
     *              - 행사 존재 및 사전등록 기간 검증
     *              - 필수 약관 동의 검증
     *              - memberId는 optional (로그인 시 자동 연결)
     * @param {CreatePreRegistrationDto} data
     * @param {string | null} memberId - 로그인한 회원의 ID (비회원이면 null)
     * @returns {Promise<PreRegistration>}
     */
    async create(data: CreatePreRegistrationDto, memberId: string | null): Promise<PreRegistration> {
        await this.assertEventAvailable(data.eventId);

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
                memberId: memberId,
                applicantName: data.applicantName,
                contactNumber: data.contactNumber,
                agreements: agreedTermsIds.length > 0 ? {
                    create: agreedTermsIds.map(termsId => ({ termsId })),
                } : undefined,
            },
        });
    }

    /**
     * @name assertEventAvailable
     * @description 행사 존재 + 사전등록 기간 검증
     * @param {string} eventId
     */
    private async assertEventAvailable(eventId: string): Promise<void> {
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
