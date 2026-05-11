import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FaqService } from "./faq.service";
import { plainToInstance } from "class-transformer";
import { FaqDTO } from "./dtos/faq.dto";
import { FaqCreateDTO } from "./dtos/faq-create.dto";

@ApiTags('faq')
@Controller('faq')
export class FaqController {
    constructor(private readonly faqService: FaqService) { };

    @Get()
    @ApiOperation({
        summary: 'FAQ 전체 조회',
        description: '모든 FAQ 목록을 조회합니다.'
    })
    @ApiResponse({
        description: 'FAQ 목록 조회 성공',
        type: FaqDTO,
        isArray: true,
    })
    async findAll(): Promise<FaqDTO[]> {
        const faqs = await this.faqService.findAll();

        return plainToInstance(FaqDTO, faqs);
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

}
