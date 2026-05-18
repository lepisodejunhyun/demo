import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { TermsDTO } from './dtos/terms.dto';
import { TermsService } from './terms.service';

@ApiTags('terms')
@Controller('terms')
export class TermsController {
    constructor(private readonly termsService: TermsService) {}

    @Get()
    @ApiOperation({
        summary: '약관 전체 조회',
        description: '사용 가능한 약관 목록을 조회합니다.',
    })
    @ApiOkResponse({
        description: '약관 목록 조회 성공',
        type: [TermsDTO],
    })
    async findAll(): Promise<TermsDTO[]> {
        const terms = await this.termsService.findAll();

        return plainToInstance(TermsDTO, terms, { excludeExtraneousValues: true });
    }
}
