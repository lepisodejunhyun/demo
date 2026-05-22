import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';
import { PageInfoDto } from '@org/api/pagination';
import { OptionalJwtAuthGuard } from '../member/guards/optional-jwt-auth.guard';
import { PreRegistrationDto } from './dtos/pre-registration.dto';
import { CreatePreRegistrationDto } from './dtos/create-pre-registration.dto';
import { PreRegistrationService } from './pre-registration.service';

@ApiTags('pre-registration')
@ApiExtraModels(PageInfoDto)
@Controller('pre-registrations')
export class PreRegistrationController {
    constructor(private readonly preRegistrationService: PreRegistrationService) {}


    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({
        summary: '사전 등록',
        description: '행사에 사전 등록합니다. 로그인 없이도 가능합니다.',
    })
    @ApiOkResponse({
        description: '사전 등록 성공',
        type: PreRegistrationDto,
    })
    @Post()
    async create(@Req() req: Request, @Body() data: CreatePreRegistrationDto): Promise<PreRegistrationDto> {
        const memberId = (req.user as any)?.id ?? null;
        const preRegistration = await this.preRegistrationService.create(data, memberId);

        return plainToInstance(PreRegistrationDto, preRegistration, { excludeExtraneousValues: true });
    }
}
