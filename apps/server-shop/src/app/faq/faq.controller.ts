import { ApiExtraModels, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OffsetPaginationDTO, PageInfoDTO, PaginationQueryDTO } from "../../libs/dtos";
import { Controller, Get, Param, Query } from "@nestjs/common";
import { FaqService } from "./faq.service";
import { FaqDTO } from "./dtos/faq.dto";
import { plainToInstance } from "class-transformer";

@ApiTags('faq')
@ApiExtraModels(PageInfoDTO)
@Controller('faq')
export class FaqController {
    constructor(
        private readonly faqService: FaqService
    ) { }

    @Get()
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
                    items: { $ref: '#/components/schemas/FaqDTO' },
                },
                pageInfo: {
                    $ref: '#/components/schemas/PageInfoDTO',
                },
            },
        },
    })
    async findAll(@Query() query: PaginationQueryDTO): Promise<OffsetPaginationDTO<FaqDTO>> {
        const result = await this.faqService.findAll(query.page, query.limit);

        return {
            items: plainToInstance(FaqDTO, result.items),
            pageInfo: result.pageInfo,
        };
    }

    @Get(':id')
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
        type: FaqDTO,
    })
    async findById(@Param('id') id: string): Promise<FaqDTO> {
        const faq = await this.faqService.findById(id);

        return plainToInstance(FaqDTO, faq);
    }
}