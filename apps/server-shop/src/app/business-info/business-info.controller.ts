import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { BusinessInfoService } from "./business-info.service";
import { BusinessInfoDTO } from "./dtos/business-info.dto";
import { plainToInstance } from "class-transformer";

@ApiTags('business-info')
@Controller('business-info')
export class BusinessInfoController {
    constructor(
        private readonly businessInfoService: BusinessInfoService
    ) { }

    @Get()
    @ApiOperation({
        summary: '사업자 정보 조회',
        description: '사업자 정보를 조회합니다.',
    })
    @ApiOkResponse({
        description: '사업자 정보 조회 성공',
        type: BusinessInfoDTO,
    })
    async findOne(): Promise<BusinessInfoDTO | null> {
        const info = await this.businessInfoService.findOne();

        return info ? plainToInstance(BusinessInfoDTO, info) : null;
    }
}