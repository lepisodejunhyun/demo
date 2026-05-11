import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Notice } from "@prisma/client";

@Injectable()
export class NoticeService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    /**
     * @name findAll
     * @description 공지사항 전체 조회
     * @return {Promise<Notice[]>}
     */
    async findAll(): Promise<Notice[]> {
        const notices = await this.prisma.notice.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return notices;

    }
}