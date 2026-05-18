import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OffsetPaginationDTO } from "../../libs/dtos";
import { Faq } from "@prisma/client";

@Injectable()
export class FaqService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async findAll(page: number, limit: number): Promise<OffsetPaginationDTO<Faq>> {
        const skip = (page - 1) * limit;

        const [items, totalItems] = await Promise.all([
            this.prisma.faq.findMany({
                where: {
                    deletedAt: null,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.faq.count({
                where: {
                    deletedAt: null,
                },
            })
        ]);

        return {
            items,
            pageInfo: {
                page,
                limit,
                pageItems: items.length,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
            }
        };

    }

    async findById(id: string): Promise<Faq> {
        const faq = await this.prisma.faq.findUnique({
            where: {
                id,
                deletedAt: null,
            }
        });

        if (!faq) throw new NotFoundException('FAQ 정보를 찾을 수 없습니다.');

        return faq;

    }
}