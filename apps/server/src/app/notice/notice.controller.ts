import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { NoticeService } from "./notice.service";
import { NoticeDto } from "./dtos/notice.dto";
import { plainToInstance } from "class-transformer";
import { CreateNoticeDto } from "./dtos/create-notice.dto";
import { OffsetPaginationDto, PageInfoDto, PaginationQueryDto } from "@org/api/pagination";
import { JwtAuthGuard } from "../admin/guards/jwt-auth.guard";

@ApiTags('notice')
@ApiExtraModels(PageInfoDto)
@UseGuards(JwtAuthGuard)
@Controller('notices')
export class NoticeController {
    constructor(
        private readonly noticeService: NoticeService
    ) { }

    @ApiOperation({
        summary: '공지사항 신규 등록',
        description: '공지사항을 신규 등록 합니다.',
    })
    @ApiOkResponse({
        description: '공지사항 신규 등록 성공',
        type: NoticeDto,
    })
    @Post('create')
    async create(@Body() data: CreateNoticeDto): Promise<NoticeDto> {
        const notice = await this.noticeService.create(data);

        return plainToInstance(NoticeDto, notice);
    }

    @ApiOperation({
        summary: '공지사항 전체 조회',
        description: "공지사항 목록을 최신순으로 조회합니다."
    })
    @ApiResponse({
        description: "공지사항 목록 조회 성공",
        schema: {
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/NoticeDto' },
                },
                pageInfo: {
                    $ref: '#/components/schemas/PageInfoDto',
                },
            },
        },
    })
    @Get()
    async findAll(@Query() query: PaginationQueryDto): Promise<OffsetPaginationDto<NoticeDto>> {
        const { items, pageInfo } = await this.noticeService.findAll(query.page, query.limit);

        return {
            items: plainToInstance(NoticeDto, items),
            pageInfo,
        };
    }

    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '공지사항 상세 조회',
        description: '공지사항을 상세 조회 합니다.',
    })
    @ApiOkResponse({
        description: '공지사항 상세 조회 성공',
        type: NoticeDto,
    })
    @Get(':id')
    async findById(@Param('id') id: string): Promise<NoticeDto> {
        const notice = await this.noticeService.findById(id);

        return plainToInstance(NoticeDto, notice);
    }

    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '공지사항 수정',
        description: '공지사항을 수정합니다.',
    })
    @ApiOkResponse({
        description: '공지사항 수정 성공',
        type: NoticeDto,
    })
    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: CreateNoticeDto): Promise<NoticeDto> {
        const notice = await this.noticeService.update(id, data);

        return plainToInstance(NoticeDto, notice);
    }

    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '공지사항 삭제',
        description: '공지사항을 삭제합니다. (소프트 딜리트)',
    })
    @ApiOkResponse({
        description: '공지사항 삭제 성공',
        type: NoticeDto,
    })
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<NoticeDto> {
        const notice = await this.noticeService.remove(id);

        return plainToInstance(NoticeDto, notice);
    }
}