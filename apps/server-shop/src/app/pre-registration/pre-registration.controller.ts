import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';
import { OffsetPaginationDto, PageInfoDto, PaginationQueryDto } from '@org/api/pagination';
import { OptionalJwtAuthGuard } from '../member/guards/optional-jwt-auth.guard';
import { EventDto } from '../event/dtos/event.dto';
import { PreRegistrationDto } from './dtos/pre-registration.dto';
import { CreatePreRegistrationDto } from './dtos/create-pre-registration.dto';
import { PreRegistrationService } from './pre-registration.service';

@ApiTags('pre-registration')
@ApiExtraModels(PageInfoDto)
@Controller('pre-registrations')
export class PreRegistrationController {
    constructor(private readonly preRegistrationService: PreRegistrationService) {}

    @ApiOperation({
        summary: '사전 등록 가능한 행사 목록',
        description: '현재 사전등록 기간 내인 행사 목록을 조회합니다.',
    })
    @ApiResponse({
        description: '사전 등록 가능 행사 목록 조회 성공',
        schema: {
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/EventDto' },
                },
                pageInfo: {
                    $ref: '#/components/schemas/PageInfoDto',
                },
            },
        },
    })
    @Get('available-events')
    async findAvailableEvents(@Query() query: PaginationQueryDto): Promise<OffsetPaginationDto<EventDto>> {
        const { items, pageInfo } = await this.preRegistrationService.findAvailableEvents(query.page, query.limit);

        return {
            items: plainToInstance(EventDto, items),
            pageInfo,
        };
    }

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
