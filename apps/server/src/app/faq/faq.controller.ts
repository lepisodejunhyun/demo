import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FaqService } from "./faq.service";
import { plainToInstance } from "class-transformer";
import { FaqDto } from "./dtos/faq.dto";
import { CreateFaqDto } from "./dtos/create-faq.dto";
import { OffsetPaginationDto, PageInfoDto, PaginationQueryDto } from "../../libs/dtos";
import { JwtAuthGuard } from "../admin/guards/jwt-auth.guard";

@ApiTags('faq')
@ApiExtraModels(PageInfoDto)
@UseGuards(JwtAuthGuard)
@Controller('faqs')
export class FaqController {
    constructor(private readonly faqService: FaqService) { };

    @ApiOperation({
        summary: 'FAQ 신규 등록',
        description: 'FAQ를 신규 등록 합니다.',
    })
    @ApiOkResponse({
        description: 'FAQ 신규 등록 성공',
        type: FaqDto,
    })
    @Post('create')
    async create(@Body() data: CreateFaqDto): Promise<FaqDto> {
        const faq = await this.faqService.create(data);

        return plainToInstance(FaqDto, faq);
    }

    @ApiOperation({
        summary: 'FAQ 전체 조회',
        description: "FAQ 목록을 최신순으로 조회합니다."
    })
    @ApiResponse({
        description: "FAQ 목록 조회 성공",
        schema: {
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/FaqDto' },
                },
                pageInfo: {
                    $ref: '#/components/schemas/PageInfoDto',
                },
            },
        },
    })
    @Get()
    async findAll(@Query() query: PaginationQueryDto): Promise<OffsetPaginationDto<FaqDto>> {
        const { items, pageInfo } = await this.faqService.findAll(query.page, query.limit);

        return {
            items: plainToInstance(FaqDto, items),
            pageInfo,
        };
    }

    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: 'FAQ 상세 조회',
        description: 'FAQ를 상세 조회 합니다.',
    })
    @ApiOkResponse({
        description: 'FAQ 상세 조회 성공',
        type: FaqDto,
    })
    @Get(':id')
    async findById(@Param('id') id: string): Promise<FaqDto> {
        const faq = await this.faqService.findById(id);

        return plainToInstance(FaqDto, faq);
    }

    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: 'FAQ 수정',
        description: 'FAQ를 수정합니다.',
    })
    @ApiOkResponse({
        description: 'FAQ 수정 성공',
        type: FaqDto,
    })
    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: CreateFaqDto): Promise<FaqDto> {
        const faq = await this.faqService.update(id, data);

        return plainToInstance(FaqDto, faq);
    }

    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: 'FAQ 삭제',
        description: 'FAQ를 삭제합니다. (소프트 딜리트)',
    })
    @ApiOkResponse({
        description: 'FAQ 삭제 성공',
        type: FaqDto,
    })
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<FaqDto> {
        const faq = await this.faqService.remove(id);

        return plainToInstance(FaqDto, faq);
    }
}
