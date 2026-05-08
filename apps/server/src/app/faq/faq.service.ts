import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

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
        const faqs = await this.prisma.faq.findMany();

        return faqs;
    }
}