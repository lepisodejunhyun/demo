import { ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OffsetPaginationDTO, PageInfoDTO, PaginationQueryDTO } from "../../libs/dtos";
import { Controller, Get, Query } from "@nestjs/common";
import { EventService } from "./event.service";
import { EventDTO } from "./dto/event.dto";
import { plainToInstance } from "class-transformer";

@ApiTags('event')
@ApiExtraModels(PageInfoDTO, EventDTO)
@Controller('event')
export class EventController {
    constructor(
        private readonly eventService: EventService
    ) { }

    @Get()
    @ApiOperation({
        summary: '행사 전체 조회',
        description: "행사 목록을 최신순으로 조회합니다."
    })
    @ApiResponse({
        description: "행사 목록 조회 성공",
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

}