import { ApiExtraModels, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OffsetPaginationDto, PageInfoDto, PaginationQueryDto } from "@org/api/pagination";
import { Controller, Get, Param, Query } from "@nestjs/common";
import { FaqService } from "./faq.service";
import { FaqDto } from "./dtos/faq.dto";
import { plainToInstance } from "class-transformer";

@ApiTags('faq')
@ApiExtraModels(PageInfoDto)
@Controller('faqs')
export class FaqController {
    constructor(
        private readonly faqService: FaqService
    ) { }

    @ApiOperation({
        summary: 'FAQ 전체 조회',
        description: 'FAQ 전체 목록을 조회합니다.'
    })
    @ApiResponse({
        description: 'FAQ 전체 목록 조회 성공',
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
        summary: 'FAQ 정보 상세 조회',
        description: 'FAQ 정보를 상세 조회 합니다.',
    })
    @ApiResponse({
        description: 'FAQ 정보 상세 조회 성공',
        type: FaqDto,
    })
    @Get(':id')
    async findById(@Param('id') id: string): Promise<FaqDto> {
        const faq = await this.faqService.findById(id);

        return plainToInstance(FaqDto, faq);
    }
}