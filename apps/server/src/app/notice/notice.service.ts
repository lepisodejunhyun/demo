import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Notice } from "@prisma/client";
import { NoticeCreateDTO } from "./dtos/notice-create.dto";
import { OffsetPaginationDTO } from "../../libs/dtos";

@Injectable()
export class NoticeService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    /**
     * @name findAll
     * @description 공지사항 페이지네이션 조회
     * @param {number} page - 페이지 번호 (기본값: 1)
     * @param {number} limit - 페이지당 항목 수 (기본값: 10)
     * @return {Promise<OffsetPaginationDTO<Notice>>}
     */
    async findAll(page: number = 1, limit: number = 10): Promise<OffsetPaginationDTO<Notice>> {
        const skip = (page - 1) * limit;

        const [items, totalItems] = await Promise.all([
            this.prisma.notice.findMany({
                where: {
                    deletedAt: null
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit,
            }),
            this.prisma.notice.count({
                where: {
                    deletedAt: null
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

    /**
     * @name create
     * @description 공지사항 신규 등록
     * @param {NoticeCreateDTO} data
     * @returns {Promise<Notice>}
     */
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

    /**
     * @name findById
     * @description 공지사항 상세 조회
     * @param {string} id
     * @returns {Promise<Notice>}
     */
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

    /**
     * @name remove
     * @description 공지사항 삭제 (Soft Delete)
     * @param {string} id
     * @returns {Promise<Notice>}
     */
    async remove(id: string): Promise<Notice> {
        const notice = await this.prisma.notice.update({
            where: { id: id },
            data: { deletedAt: new Date() },
        });

        return notice;
    }

    /**
     * @name update
     * @description 공지사항 수정
     * @param {string} id
     * @param {NoticeCreateDTO} data
     * @returns {Promise<Notice>}
     */
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