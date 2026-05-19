import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { BusinessInfoService } from "./business-info.service";
import { BusinessInfoDto } from "./dtos/business-info.dto";
import { UpdateBusinessInfoDto } from "./dtos/update-business-info.dto";
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
        type: BusinessInfoDto,
    })
    async findOne(): Promise<BusinessInfoDto | null> {
        const info = await this.businessInfoService.findOne();

        return info ? plainToInstance(BusinessInfoDto, info) : null;
    }

    @Patch()
    @ApiOperation({
        summary: '사업자 정보 수정',
        description: '사업자 정보를 저장합니다. 기존 데이터가 없으면 신규 등록되고, 있으면 수정됩니다.',
    })
    @ApiOkResponse({
        description: '사업자 정보 저장 성공',
        type: BusinessInfoDto,
    })
    async upsert(@Body() data: UpdateBusinessInfoDto): Promise<BusinessInfoDto> {
        const info = await this.businessInfoService.upsert(data);

        return plainToInstance(BusinessInfoDto, info);
    }
}
