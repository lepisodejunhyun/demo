import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { BusinessInfo } from "@prisma/client";

@Injectable()
export class BusinessInfoService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async findOne(): Promise<BusinessInfo | null> {
        const info = this.prisma.businessInfo.findFirst();

        return info;

    }
}