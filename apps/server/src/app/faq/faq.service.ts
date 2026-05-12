import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Faq } from "@prisma/client"
import { FaqCreateDTO } from "./dtos/faq-create.dto";
import { OffsetPaginationDTO } from "../../libs/dtos";

@Injectable()
export class FaqService {
    constructor(
        private readonly prisma: PrismaService
    ) { }


    /**
     * @name findAll
     * @description FAQ 페이지네이션 조회
     * @param {number} page - 페이지 번호 (기본값: 1)
     * @param {number} limit - 페이지당 항목 수 (기본값: 10)
     * @returns {Promise<OffsetPaginationDTO<Faq>>}
     */
    async findAll(page: number = 1, limit: number = 10): Promise<OffsetPaginationDTO<Faq>> {
        const skip = (page - 1) * limit;

        const [items, totalItems] = await Promise.all([
            this.prisma.faq.findMany({
                where: {
                    deletedAt: null,
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit,
            }),
            this.prisma.faq.count({
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

    /**
     * @name create
     * @description FAQ 생성
     * @param {FaqCreateDTO} data
     * @returns {Promise<Faq>}
     */
    async create(data: FaqCreateDTO): Promise<Faq> {

        const { question, answer } = data;

        const faq = await this.prisma.faq.create({
            data: {
                question: question,
                answer: answer,
            },
        });

        return faq;
    }

    async findById(id: string): Promise<Faq> {
        const faq = await this.prisma.faq.findUnique({
            where: {
                id: id,
                deletedAt: null,
            }
        });

        if (!faq) throw new NotFoundException('FAQ를 찾을 수 없습니다.');

        return faq;

    }

    async remove(id: string): Promise<Faq> {
        const faq = await this.prisma.faq.update({
            where: { id: id },
            data: { deletedAt: new Date() },
        });

        return faq;
    }

    async update(id: string, data: FaqCreateDTO): Promise<Faq> {
        await this.findById(id);

        const { question, answer } = data;

        const faq = await this.prisma.faq.update({
            where: {
                id: id,
            },
            data: {
                question: question,
                answer: answer,
            }
        });

        return faq;
    }
}