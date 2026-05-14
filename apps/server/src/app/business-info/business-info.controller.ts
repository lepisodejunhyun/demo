import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { BusinessInfoService } from "./business-info.service";
import { BusinessInfoDTO } from "./dtos/business-info.dto";
import { BusinessInfoUpdateDTO } from "./dtos/business-info-update.dto";
import { JwtAuthGuard } from "../admin/guards/jwt-auth.guard";

@ApiTags('business-info')
@UseGuards(JwtAuthGuard)
@Controller('business-info')
export class BusinessInfoController {
    constructor(
        private readonly businessInfoService: BusinessInfoService
    ) { }

    @Get()
    @ApiOperation({
        summary: '사업자 정보 조회',
        description: '사업자 정보를 조회합니다. 데이터가 없으면 null을 반환합니다 (빈 상태).',
    })
    @ApiOkResponse({
        description: '사업자 정보 조회 성공',
        type: BusinessInfoDTO,
    })
    async findOne(): Promise<BusinessInfoDTO | null> {
        const info = await this.businessInfoService.findOne();

        return info ? plainToInstance(BusinessInfoDTO, info) : null;
    }

    @Patch()
    @ApiOperation({
        summary: '사업자 정보 수정',
        description: '사업자 정보를 저장합니다. 기존 데이터가 없으면 신규 등록되고, 있으면 수정됩니다.',
    })
    @ApiOkResponse({
        description: '사업자 정보 저장 성공',
        type: BusinessInfoDTO,
    })
    async upsert(@Body() data: BusinessInfoUpdateDTO): Promise<BusinessInfoDTO> {
        const info = await this.businessInfoService.upsert(data);

        return plainToInstance(BusinessInfoDTO, info);
    }
}
