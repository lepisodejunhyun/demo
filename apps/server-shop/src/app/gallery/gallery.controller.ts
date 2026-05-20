import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { OffsetPaginationDto, PageInfoDto, PaginationQueryDto } from '@org/api/pagination';
import { GalleryDto } from './dtos/gallery.dto';
import { GalleryService } from './gallery.service';

@ApiTags('gallery')
@ApiExtraModels(PageInfoDto)
@Controller('galleries')
export class GalleryController {
    constructor(private readonly galleryService: GalleryService) { }

    @ApiOperation({
        summary: '갤러리 전체 조회',
        description: "갤러리 목록을 최신순으로 조회합니다."
    })
    @ApiResponse({
        description: '갤러리 목록 조회 성공',
        schema: {
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/GalleryDto' },
                },
                pageInfo: {
                    $ref: '#/components/schemas/PageInfoDto',
                },
            },
        },
    })
    @Get()
    async findAll(@Query() query: PaginationQueryDto): Promise<OffsetPaginationDto<GalleryDto>> {
        const { items, pageInfo } = await this.galleryService.findAll(query.page, query.limit);

        return {
            items: plainToInstance(GalleryDto, items),
            pageInfo,
        };
    }

    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '갤러리 정보 상세 조회',
        description: '갤러리 정보를 상세 조회 합니다.',
    })
    @ApiOkResponse({
        description: '갤러리 정보 상세 조회 성공',
        type: GalleryDto,
    })
    @Get(':id')
    async findById(@Param('id') id: string): Promise<GalleryDto> {
        const gallery = await this.galleryService.findById(id);

        return plainToInstance(GalleryDto, gallery);
    }
}
