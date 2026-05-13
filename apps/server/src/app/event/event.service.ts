import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OffsetPaginationDTO } from "../../libs/dtos";
import { Event } from "@prisma/client";

@Injectable()
export class EventService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

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

}