import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePreRegistrationDto } from './dtos/create-pre-registration.dto';
import { PreRegistration } from '@prisma/client';
import { EventService } from '../event/event.service';

@Injectable()
export class PreRegistrationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly eventService: EventService,
    ) {}

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
        await this.eventService.assertEventAvailable(data.eventId);

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
}
