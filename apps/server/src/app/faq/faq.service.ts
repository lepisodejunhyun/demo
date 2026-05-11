import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Faq } from "@prisma/client"
import { FaqCreateDTO } from "./dtos/faq-create.dto";

@Injectable()
export class FaqService {
    constructor(
        private readonly prisma: PrismaService
    ) { }


    /**
     * @name findAll
     * @description FAQ 전체 조회
     * @returns {Promise<Faq[]>}
     */
    async findAll(): Promise<Faq[]> {
        const faqs = await this.prisma.faq.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return faqs;
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
        })

        return faq;
    }

    async findById(id: string): Promise<Faq> {
        const faq = await this.prisma.faq.findUnique({
            where: {
                id: id,
                deletedAt: null,
            }
        })

        if (!faq) throw new NotFoundException('FAQ를 찾을 수 없습니다.');

        return faq;

    }
}