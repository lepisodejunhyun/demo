import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OffsetPaginationDto, PageInfoDto, PaginationQueryDto } from "@org/api/pagination";
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { PreRegistrationService } from "./pre-registration.service";
import { PreRegistrationDto } from "./dtos/pre-registration.dto";
import { plainToInstance } from "class-transformer";
import { CreatePreRegistrationDto } from "./dtos/create-pre-registration.dto";
import { UpdatePreRegistrationDto } from "./dtos/update-pre-registration.dto";
import { AvailableEventDto } from "./dtos/available-event.dto";
import { JwtAuthGuard } from "../admin/guards/jwt-auth.guard";

@ApiTags('pre-registration')
@ApiExtraModels(PageInfoDto)
@UseGuards(JwtAuthGuard)
@Controller('pre-registrations')
export class PreRegistrationController {
    constructor(
        private readonly preRegistrationService: PreRegistrationService
    ) { }

    @ApiOperation({
        summary: '사전 등록 신규 생성',
        description: '행사를 선택하고 신청자 정보를 입력하여 사전 등록합니다. 행사가 사전 등록 가능한 상태인지 서버에서 검증합니다.',
    })
    @ApiOkResponse({
        description: '사전 등록 성공',
        type: PreRegistrationDto,
    })
    @Post('create')
    async create(@Body() data: CreatePreRegistrationDto): Promise<PreRegistrationDto> {
        const item = await this.preRegistrationService.create(data);

        return plainToInstance(PreRegistrationDto, item);
    }

    @ApiOperation({
        summary: '사전 등록 전체 조회',
        description: '등록된 사전 등록 신청 내역을 최신순으로 조회합니다. (deletedAt이 null인 내역만)',
    })
    @ApiResponse({
        description: '사전 등록 목록 조회 성공',
        schema: {
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/PreRegistrationDto' },
                },
                pageInfo: {
                    $ref: '#/components/schemas/PageInfoDto',
                },
            },
        },
    })
    @Get()
    async findAll(@Query() query: PaginationQueryDto): Promise<OffsetPaginationDto<PreRegistrationDto>> {
        const { items, pageInfo } = await this.preRegistrationService.findAll(query.page, query.limit);

        return {
            items: plainToInstance(PreRegistrationDto, items),
            pageInfo,
        };
    }

    @ApiOperation({
        summary: '사전 등록 가능한 행사 목록',
        description: '사전 등록 기간이 설정되어 있고 현재 시각이 그 기간 내인 행사 목록을 반환합니다. (등록 폼 dropdown용)',
    })
    @ApiOkResponse({
        description: '가능한 행사 목록 조회 성공',
        type: AvailableEventDto,
        isArray: true,
    })
    @Get('available-events')
    async findAvailableEvents(): Promise<AvailableEventDto[]> {
        const events = await this.preRegistrationService.findAvailableEvents();

        return plainToInstance(AvailableEventDto, events);
    }

    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '사전 등록 상세 조회',
        description: '행사명, 신청자 이름, 연락처, 소속, 신청일시를 조회합니다.',
    })
    @ApiOkResponse({
        description: '사전 등록 상세 조회 성공',
        type: PreRegistrationDto,
    })
    @Get(':id')
    async findById(@Param('id') id: string): Promise<PreRegistrationDto> {
        const item = await this.preRegistrationService.findById(id);

        return plainToInstance(PreRegistrationDto, item);
    }

    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '사전 등록 수정',
        description: '신청자 정보(이름/연락처/소속)만 수정합니다. 행사 변경은 불가합니다.',
    })
    @ApiOkResponse({
        description: '사전 등록 수정 성공',
        type: PreRegistrationDto,
    })
    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: UpdatePreRegistrationDto): Promise<PreRegistrationDto> {
        const item = await this.preRegistrationService.update(id, data);

        return plainToInstance(PreRegistrationDto, item);
    }

    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '사전 등록 삭제',
        description: '선택한 사전 등록 내역을 삭제합니다. (소프트 딜리트)',
    })
    @ApiOkResponse({
        description: '사전 등록 삭제 성공',
        type: PreRegistrationDto,
    })
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<PreRegistrationDto> {
        const item = await this.preRegistrationService.remove(id);

        return plainToInstance(PreRegistrationDto, item);
    }
}
