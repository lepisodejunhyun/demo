import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { NoticeService } from "./notice.service";
import { NoticeDTO } from "./dtos/notice.dto";
import { plainToInstance } from "class-transformer";
import { NoticeCreateDTO } from "./dtos/notice-create.dto";
import { OffsetPaginationDTO, PageInfoDTO, PaginationQueryDTO } from "../../libs/dtos";
import { JwtAuthGuard } from "../admin/guards/jwt-auth.guard";

@ApiTags('notice')
@ApiExtraModels(PageInfoDTO)
@UseGuards(JwtAuthGuard)
@Controller('notice')
export class NoticeController {
    constructor(
        private readonly noticeService: NoticeService
    ) { }

    @Get()
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
                    items: { $ref: '#/components/schemas/NoticeDTO' },
                },
                pageInfo: {
                    $ref: '#/components/schemas/PageInfoDTO',
                },
            },
        },
    })
    async findAll(@Query() query: PaginationQueryDTO): Promise<OffsetPaginationDTO<NoticeDTO>> {
        const result = await this.noticeService.findAll(query.page, query.limit);

        return {
            items: plainToInstance(NoticeDTO, result.items),
            pageInfo: result.pageInfo,
        };
    }

    @Post('create')
    @ApiOperation({
        summary: '공지사항 신규 등록',
        description: '공지사항을 신규 등록 합니다.',
    })
    @ApiOkResponse({
        description: '공지사항 신규 등록 성공',
        type: NoticeDTO,
    })
    async create(@Body() data: NoticeCreateDTO): Promise<NoticeDTO> {
        const notice = await this.noticeService.create(data);

        return plainToInstance(NoticeDTO, notice);
    }

    @Get(':id')
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
        type: NoticeDTO,
    })
    async findById(@Param('id') id: string): Promise<NoticeDTO> {
        const notice = await this.noticeService.findById(id);

        return plainToInstance(NoticeDTO, notice);
    }

    @Delete(':id')
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
        type: NoticeDTO,
    })
    async remove(@Param('id') id: string): Promise<NoticeDTO> {
        const notice = await this.noticeService.remove(id);

        return plainToInstance(NoticeDTO, notice);
    }

    @Patch(':id')
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
        type: NoticeDTO,
    })
    async update(@Param('id') id: string, @Body() data: NoticeCreateDTO): Promise<NoticeDTO> {
        const notice = await this.noticeService.update(id, data);

        return plainToInstance(NoticeDTO, notice);
    }

}