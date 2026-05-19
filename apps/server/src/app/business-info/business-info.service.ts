import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { BusinessInfo } from "@prisma/client";
import { UpdateBusinessInfoDto } from "./dtos/update-business-info.dto";

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
        return this.prisma.businessInfo.findFirst();
    }

    /**
     * @name upsert
     * @description 사업자 정보 저장 (있으면 update, 없으면 create).
     *              관리자가 처음 입력하면 create, 이후 호출은 update.
     * @param {UpdateBusinessInfoDto} data
     * @returns {Promise<BusinessInfo>}
     */
    async upsert(data: UpdateBusinessInfoDto): Promise<BusinessInfo> {
        const existing = await this.prisma.businessInfo.findFirst();

        if (existing) {
            return this.prisma.businessInfo.update({
                where: { id: existing.id },
                data,
            });
        }

        return this.prisma.businessInfo.create({
            data,
        });
    }
}
