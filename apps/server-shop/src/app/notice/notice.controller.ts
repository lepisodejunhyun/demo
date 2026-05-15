import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { OffsetPaginationDTO, PageInfoDTO, PaginationQueryDTO } from '../../libs/dtos';
import { NoticeDTO } from './dtos/notice.dto';
import { NoticeService } from './notice.service';

@ApiTags('notice')
@ApiExtraModels(PageInfoDTO)
@Controller('notice')
export class NoticeController {
    constructor(private readonly noticeService: NoticeService) {}

    @Get()
    @ApiOperation({
        summary: '공지사항 전체 조회',
        description: "공지사항 목록을 최신순으로 조회합니다."
    })
    @ApiResponse({
        description: '공지사항 목록 조회 성공',
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

    @Get(':id')
    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '공지사항 정보 상세 조회',
        description: '공지사항 정보를 상세 조회 합니다.',
    })
    @ApiOkResponse({
        description: '공지사항 정보 상세 조회 성공',
        type: NoticeDTO,
    })
    async findById(@Param('id') id: string): Promise<NoticeDTO> {
        const notice = await this.noticeService.findById(id);

        return plainToInstance(NoticeDTO, notice);
    }
}
