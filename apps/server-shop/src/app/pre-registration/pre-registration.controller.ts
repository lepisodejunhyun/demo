import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';
import { OffsetPaginationDTO, PageInfoDTO, PaginationQueryDTO } from '../../libs/dtos';
import { OptionalJwtAuthGuard } from '../member/guards/optional-jwt-auth.guard';
import { EventDTO } from '../event/dtos/event.dto';
import { PreRegistrationDTO } from './dtos/pre-registration.dto';
import { PreRegistrationCreateDTO } from './dtos/pre-registration-create.dto';
import { PreRegistrationService } from './pre-registration.service';

@ApiTags('pre-registration')
@ApiExtraModels(PageInfoDTO)
@Controller('pre-registration')
export class PreRegistrationController {
    constructor(private readonly preRegistrationService: PreRegistrationService) {}

    @Get('available-events')
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
                    items: { $ref: '#/components/schemas/EventDTO' },
                },
                pageInfo: {
                    $ref: '#/components/schemas/PageInfoDTO',
                },
            },
        },
    })
    async findAvailableEvents(@Query() query: PaginationQueryDTO): Promise<OffsetPaginationDTO<EventDTO>> {
        const result = await this.preRegistrationService.findAvailableEvents(query.page, query.limit);

        return {
            items: plainToInstance(EventDTO, result.items),
            pageInfo: result.pageInfo,
        };
    }

    @Post()
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({
        summary: '사전 등록',
        description: '행사에 사전 등록합니다. 로그인 없이도 가능합니다.',
    })
    @ApiOkResponse({
        description: '사전 등록 성공',
        type: PreRegistrationDTO,
    })
    async create(@Req() req: Request, @Body() data: PreRegistrationCreateDTO): Promise<PreRegistrationDTO> {
        const memberId = (req.user as any)?.id ?? null;
        const preRegistration = await this.preRegistrationService.create(data, memberId);

        return plainToInstance(PreRegistrationDTO, preRegistration, { excludeExtraneousValues: true });
    }
}
