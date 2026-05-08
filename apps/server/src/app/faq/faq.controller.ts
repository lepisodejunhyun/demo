import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FaqService } from "./faq.service";
import { plainToInstance } from "class-transformer";

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

}
