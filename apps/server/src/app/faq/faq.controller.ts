import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FaqService } from "./faq.service";
import { plainToInstance } from "class-transformer";
import { FaqDTO } from "./dtos/faq.dto";
import { FaqCreateDTO } from "./dtos/faq-create.dto";
import { OffsetPaginationDTO, PageInfoDTO, PaginationQueryDTO } from "../../libs/dtos";

@ApiTags('faq')
@ApiExtraModels(PageInfoDTO)
@Controller('faq')
export class FaqController {
    constructor(private readonly faqService: FaqService) { };

    @Get()
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

    @Post('create')
    @ApiOperation({
        summary: 'FAQ 신규 등록',
        description: 'FAQ를 신규 등록 합니다.',
    })
    @ApiOkResponse({
        description: 'FAQ 신규 등록 성공',
        type: FaqDTO,
    })
    async create(@Body() data: FaqCreateDTO): Promise<FaqDTO> {
        const faq = await this.faqService.create(data);

        return plainToInstance(FaqDTO, faq);
    }

    @Get(':id')
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
        type: FaqDTO,
    })
    async findById(@Param('id') id: string): Promise<FaqDTO> {
        const faq = await this.faqService.findById(id);

        return plainToInstance(FaqDTO, faq);
    }

    @Delete(':id')
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
        type: FaqDTO,
    })
    async remove(@Param('id') id: string): Promise<FaqDTO> {
        const faq = await this.faqService.remove(id);

        return plainToInstance(FaqDTO, faq);
    }

    @Patch(':id')
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
        type: FaqDTO,
    })
    async update(@Param('id') id: string, @Body() data: FaqCreateDTO): Promise<FaqDTO> {
        const faq = await this.faqService.update(id, data);

        return plainToInstance(FaqDTO, faq);
    }

}
