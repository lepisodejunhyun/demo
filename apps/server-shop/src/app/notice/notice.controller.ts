import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { OffsetPaginationDto, PageInfoDto, PaginationQueryDto } from '../../libs/dtos';
import { NoticeDto } from './dtos/notice.dto';
import { NoticeService } from './notice.service';

@ApiTags('notice')
@ApiExtraModels(PageInfoDto)
@Controller('notices')
export class NoticeController {
    constructor(private readonly noticeService: NoticeService) {}

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
        summary: '공지사항 정보 상세 조회',
        description: '공지사항 정보를 상세 조회 합니다.',
    })
    @ApiOkResponse({
        description: '공지사항 정보 상세 조회 성공',
        type: NoticeDto,
    })
    @Get(':id')
    async findById(@Param('id') id: string): Promise<NoticeDto> {
        const notice = await this.noticeService.findById(id);

        return plainToInstance(NoticeDto, notice);
    }
}
