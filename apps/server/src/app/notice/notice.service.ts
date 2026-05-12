import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Notice } from "@prisma/client";
import { NoticeCreateDTO } from "./notice-create.dto";

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
        });

        return notices;
    }

    async create(data: NoticeCreateDTO): Promise<Notice> {

        const { title, content } = data;

        const notice = await this.prisma.notice.create({
            data: {
                title: title,
                content: content,
            },
        });

        return notice;
    }

    async findById(id: string): Promise<Notice> {
        const notice = await this.prisma.notice.findFirst({
            where: {
                id: id,
                deletedAt: null,
            }
        });

        if (!notice) throw new NotFoundException('공지사항을 찾을 수 없습니다.');

        return notice;
    }

    async remove(id: string): Promise<Notice> {
        const notice = await this.prisma.notice.update({
            where: { id: id },
            data: { deletedAt: new Date() },
        });

        return notice;
    }

    async update(id: string, data: NoticeCreateDTO): Promise<Notice> {
        await this.findById(id);

        const { title, content } = data;

        const notice = await this.prisma.notice.update({
            where: {
                id: id,
            },
            data: {
                title: title,
                content: content,
            }
        });

        return notice;
    }
}