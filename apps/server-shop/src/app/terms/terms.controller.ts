import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { TermsDto } from './dtos/terms.dto';
import { TermsService } from './terms.service';

@ApiTags('terms')
@Controller('terms')
export class TermsController {
    constructor(private readonly termsService: TermsService) {}

    @ApiOperation({
        summary: '약관 전체 조회',
        description: '사용 가능한 약관 목록을 조회합니다.',
    })
    @ApiOkResponse({
        description: '약관 목록 조회 성공',
        type: [TermsDto],
    })
    @Get()
    async findAll(): Promise<TermsDto[]> {
        const terms = await this.termsService.findAll();

        return plainToInstance(TermsDto, terms, { excludeExtraneousValues: true });
    }
}
