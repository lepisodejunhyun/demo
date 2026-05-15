import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { OffsetPaginationDTO, PageInfoDTO, PaginationQueryDTO } from '../../libs/dtos';
import { GalleryDTO } from './dtos/gallery.dto';
import { GalleryService } from './gallery.service';

@ApiTags('gallery')
@ApiExtraModels(PageInfoDTO)
@Controller('gallery')
export class GalleryController {
    constructor(private readonly galleryService: GalleryService) {}

    @Get()
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
                    items: { $ref: '#/components/schemas/GalleryDTO' },
                },
                pageInfo: {
                    $ref: '#/components/schemas/PageInfoDTO',
                },
            },
        },
    })
    async findAll(@Query() query: PaginationQueryDTO): Promise<OffsetPaginationDTO<GalleryDTO>> {
        const result = await this.galleryService.findAll(query.page, query.limit);

        return {
            items: plainToInstance(GalleryDTO, result.items),
            pageInfo: result.pageInfo,
        };
    }

    @Get(':id')
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
        type: GalleryDTO,
    })
    async findById(@Param('id') id: string): Promise<GalleryDTO> {
        const gallery = await this.galleryService.findById(id);

        return plainToInstance(GalleryDTO, gallery);
    }
}
