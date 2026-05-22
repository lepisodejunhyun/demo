import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OffsetPaginationDto, PageInfoDto, PaginationQueryDto } from "@org/api/pagination";
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { EventService } from "./event.service";
import { EventDto } from "./dtos/event.dto";
import { plainToInstance } from "class-transformer";
import { CreateEventDto } from "./dtos/create-event.dto";
import { JwtAuthGuard } from "../admin/guards/jwt-auth.guard";

@ApiTags('event')
@ApiExtraModels(PageInfoDto)
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventController {
    constructor(
        private readonly eventService: EventService
    ) { }

    @ApiOperation({
        summary: '행사 정보 신규 등록',
        description: '행사 정보를 신규 등록 합니다.',
    })
    @ApiOkResponse({
        description: '행사 정보 신규 등록 성공',
        type: EventDto,
    })
    @Post('create')
    async create(@Body() data: CreateEventDto): Promise<EventDto> {
        const event = await this.eventService.create(data);

        return plainToInstance(EventDto, event);
    }

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

    @ApiOperation({
        summary: '사전 등록 가능한 행사 목록',
        description: '사전 등록 기간이 설정되어 있고 현재 시각이 그 기간 내인 행사 목록을 반환합니다. (등록 폼 dropdown용)',
    })
    @ApiOkResponse({
        description: '가능한 행사 목록 조회 성공',
        type: EventDto,
        isArray: true,
    })
    @Get('available-events')
    async findAvailableEvents(): Promise<EventDto[]> {
        const events = await this.eventService.findAvailableEvents();

        return plainToInstance(EventDto, events);
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

    @ApiOperation({
        summary: '행사 정보 수정',
        description: '행사 정보를 수정합니다.'
    })
    @ApiOkResponse({
        description: '행사 정보 수정 성공',
        type: EventDto,
    })
    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: CreateEventDto): Promise<EventDto> {
        const event = await this.eventService.update(id, data);

        return plainToInstance(EventDto, event);
    }

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
        type: EventDto,
    })
    @Delete(':id')
    async remove(@Param('id') id): Promise<EventDto> {
        const event = await this.eventService.remove(id);

        return plainToInstance(EventDto, event);
    }

}