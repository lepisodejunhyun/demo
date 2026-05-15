import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { OffsetPaginationDTO, PageInfoDTO, PaginationQueryDTO } from '../../libs/dtos';
import { EventDTO } from './dtos/event.dto';
import { EventService } from './event.service';

@ApiTags('event')
@ApiExtraModels(PageInfoDTO)
@Controller('event')
export class EventController {
    constructor(private readonly eventService: EventService) {}

    @Get()
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
                    items: { $ref: '#/components/schemas/EventDTO' },
                },
                pageInfo: {
                    $ref: '#/components/schemas/PageInfoDTO',
                },
            },
        },
    })
    async findAll(@Query() query: PaginationQueryDTO): Promise<OffsetPaginationDTO<EventDTO>> {
        const result = await this.eventService.findAll(query.page, query.limit);

        return {
            items: plainToInstance(EventDTO, result.items),
            pageInfo: result.pageInfo,
        };
    }

    @Get(':id')
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
        type: EventDTO,
    })
    async findById(@Param('id') id: string): Promise<EventDTO> {
        const event = await this.eventService.findById(id);

        return plainToInstance(EventDTO, event);
    }
}
