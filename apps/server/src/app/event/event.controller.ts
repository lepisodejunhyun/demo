import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OffsetPaginationDTO, PageInfoDTO, PaginationQueryDTO } from "../../libs/dtos";
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { EventService } from "./event.service";
import { EventDTO } from "./dtos/event.dto";
import { plainToInstance } from "class-transformer";
import { EventCreateDTO } from "./dtos/event-create.dto";
import { JwtAuthGuard } from "../admin/guards/jwt-auth.guard";

@ApiTags('event')
@ApiExtraModels(PageInfoDTO)
@UseGuards(JwtAuthGuard)
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

    @Delete(':id')
    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '행사 정보 삭제',
        description: '행사 정보를 삭제합니다. (소프트 딜리트)',
    })
    @ApiOkResponse({
        description: '행사 정보 삭제 성공',
        type: EventDTO,
    })
    async remove(@Param('id') id): Promise<EventDTO> {
        const event = await this.eventService.remove(id);

        return plainToInstance(EventDTO, event);
    }

    @Post('create')
    @ApiOperation({
        summary: '행사 정보 신규 등록',
        description: '행사 정보를 신규 등록 합니다.',
    })
    @ApiOkResponse({
        description: '행사 정보 신규 등록 성공',
        type: EventDTO,
    })
    async create(@Body() data: EventCreateDTO): Promise<EventDTO> {
        const event = await this.eventService.create(data);

        return plainToInstance(EventDTO, event);
    }

    @Patch(':id')
    @ApiOperation({
        summary: '행사 정보 수정',
        description: '행사 정보를 수정합니다.'
    })
    @ApiOkResponse({
        description: '행사 정보 수정 성공',
        type: EventDTO,
    })
    async update(@Param('id') id: string, @Body() data: EventCreateDTO): Promise<EventDTO> {
        const event = await this.eventService.update(id, data);

        return plainToInstance(EventDTO, event);
    }

}