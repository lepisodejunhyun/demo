import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OffsetPaginationDto, PageInfoDto, PaginationQueryDto } from "../../libs/dtos";
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { GalleryService } from "./gallery.service";
import { GalleryDto } from "./dtos/gallery.dto";
import { plainToInstance } from "class-transformer";
import { CreateGalleryDto } from "./dtos/create-gallery.dto";
import { JwtAuthGuard } from "../admin/guards/jwt-auth.guard";

@ApiTags('gallery')
@ApiExtraModels(PageInfoDto)
@UseGuards(JwtAuthGuard)
@Controller('gallery')
export class GalleryController {
    constructor(
        private readonly galleryService: GalleryService
    ) { }

    @Post('create')
    @ApiOperation({
        summary: '갤러리 신규 등록',
        description: '갤러리를 신규 등록 합니다.',
    })
    @ApiOkResponse({
        description: '갤러리 신규 등록 성공',
        type: GalleryDto,
    })
    async create(@Body() data: CreateGalleryDto): Promise<GalleryDto> {
        const gallery = await this.galleryService.create(data);

        return plainToInstance(GalleryDto, gallery);
    }

    @Get()
    @ApiOperation({
        summary: '갤러리 전체 조회',
        description: "갤러리 목록을 최신순으로 조회합니다."
    })
    @ApiResponse({
        description: "갤러리 목록 조회 성공",
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
    async findAll(@Query() query: PaginationQueryDto): Promise<OffsetPaginationDto<GalleryDto>> {
        const result = await this.galleryService.findAll(query.page, query.limit);

        return {
            items: plainToInstance(GalleryDto, result.items),
            pageInfo: result.pageInfo,
        };
    }

    @Get(':id')
    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '갤러리 상세 조회',
        description: '갤러리를 상세 조회 합니다.',
    })
    @ApiOkResponse({
        description: '갤러리 상세 조회 성공',
        type: GalleryDto,
    })
    async findById(@Param('id') id: string): Promise<GalleryDto> {
        const gallery = await this.galleryService.findById(id);

        return plainToInstance(GalleryDto, gallery);
    }

    @Patch(':id')
    @ApiOperation({
        summary: '갤러리 수정',
        description: '갤러리를 수정합니다.'
    })
    @ApiOkResponse({
        description: '갤러리 수정 성공',
        type: GalleryDto,
    })
    async update(@Param('id') id: string, @Body() data: CreateGalleryDto): Promise<GalleryDto> {
        const gallery = await this.galleryService.update(id, data);

        return plainToInstance(GalleryDto, gallery);
    }

    @Delete(':id')
    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '갤러리 삭제',
        description: '갤러리를 삭제합니다. (소프트 딜리트)',
    })
    @ApiOkResponse({
        description: '갤러리 삭제 성공',
        type: GalleryDto,
    })
    async remove(@Param('id') id): Promise<GalleryDto> {
        const gallery = await this.galleryService.remove(id);

        return plainToInstance(GalleryDto, gallery);
    }

}
