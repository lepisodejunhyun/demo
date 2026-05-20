import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { BusinessInfo } from "@prisma/client";

@Injectable()
export class BusinessInfoService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    /**
     * @name findOne
     * @description 사업자 정보 조회 (단일 레코드).
     *              데이터가 없으면 null 반환 → 클라이언트에서 빈 상태로 표시.
     * @returns {Promise<BusinessInfo | null>}
     */
    async findOne(): Promise<BusinessInfo | null> {
        const info = await this.prisma.businessInfo.findFirst();

        return info;

    }
}