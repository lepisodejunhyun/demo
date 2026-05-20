import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { OffsetPaginationDto, PageInfoDto, PaginationQueryDto } from '../../libs/dtos';
import { EventDto } from './dtos/event.dto';
import { EventService } from './event.service';

@ApiTags('event')
@ApiExtraModels(PageInfoDto)
@Controller('events')
export class EventController {
    constructor(private readonly eventService: EventService) { }

    @ApiOperation({
        summary: '행사 전체 조회',
        description: "행사 목록을 최신순으로 조회합니다."
    })
    @ApiResponse({
        description: '행사 목록 조회 성공',
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
    @Get()
    async findAll(@Query() query: PaginationQueryDto): Promise<OffsetPaginationDto<EventDto>> {
        const { items, pageInfo } = await this.eventService.findAll(query.page, query.limit);

        return {
            items: plainToInstance(EventDto, items),
            pageInfo,
        };
    }

    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '행사 정보 상세 조회',
        description: '행사 정보를 상세 조회 합니다.',
    })
    @ApiOkResponse({
        description: '행사 정보 상세 조회 성공',
        type: EventDto,
    })
    @Get(':id')
    async findById(@Param('id') id: string): Promise<EventDto> {
        const event = await this.eventService.findById(id);

        return plainToInstance(EventDto, event);
    }
}
