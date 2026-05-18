import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Terms } from '@prisma/client';

@Injectable()
export class TermsService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    /**
     * @name findAll
     * @description 전체 약관 조회 (삭제되지 않은 것만, 필수 약관 우선)
     * @returns {Promise<Terms[]>}
     */
    async findAll(): Promise<Terms[]> {
        return this.prisma.terms.findMany({
            where: { deletedAt: null },
            orderBy: [
                { isRequired: 'desc' },
                { createdAt: 'asc' },
            ],
        });
    }
}
