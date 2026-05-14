import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OffsetPaginationDTO, PageInfoDTO, PaginationQueryDTO } from "../../libs/dtos";
import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { InquiryService } from "./inquiry.service";
import { InquiryDTO } from "./dtos/inquiry.dto";
import { plainToInstance } from "class-transformer";
import { InquiryAnswerDTO } from "./dtos/inquiry-answer.dto";
import { JwtAuthGuard } from "../admin/guards/jwt-auth.guard";

@ApiTags('inquiry')
@ApiExtraModels(PageInfoDTO)
@UseGuards(JwtAuthGuard)
@Controller('inquiry')
export class InquiryController {
    constructor(
        private readonly inquiryService: InquiryService
    ) { }

    @Get()
    @ApiOperation({
        summary: '1:1 문의 전체 조회',
        description: '모든 1:1 문의 내역을 최신순으로 조회합니다. (deletedAt이 null인 항목만)'
    })
    @ApiResponse({
        description: '1:1 문의 목록 조회 성공',
        schema: {
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/InquiryDTO' },
                },
                pageInfo: {
                    $ref: '#/components/schemas/PageInfoDTO',
                },
            },
        },
    })
    async findAll(@Query() query: PaginationQueryDTO): Promise<OffsetPaginationDTO<InquiryDTO>> {
        const result = await this.inquiryService.findAll(query.page, query.limit);

        return {
            items: plainToInstance(InquiryDTO, result.items),
            pageInfo: result.pageInfo,
        };
    }

    @Get(':id')
    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '1:1 문의 상세 조회',
        description: '문의 제목, 작성자, 내용, 첨부 이미지, 등록일시, 답변 내용을 조회합니다.',
    })
    @ApiOkResponse({
        description: '1:1 문의 상세 조회 성공',
        type: InquiryDTO,
    })
    async findById(@Param('id') id: string): Promise<InquiryDTO> {
        const inquiry = await this.inquiryService.findById(id);

        return plainToInstance(InquiryDTO, inquiry);
    }

    @Patch(':id')
    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '1:1 문의 답변 작성/수정',
        description: '답변을 작성하거나 수정합니다. body의 status를 함께 보내면 상태도 같이 변경됩니다.',
    })
    @ApiOkResponse({
        description: '답변 저장 성공',
        type: InquiryDTO,
    })
    async updateAnswer(@Param('id') id: string, @Body() data: InquiryAnswerDTO): Promise<InquiryDTO> {
        const inquiry = await this.inquiryService.updateAnswer(id, data);

        return plainToInstance(InquiryDTO, inquiry);
    }

    @Delete(':id')
    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '1:1 문의 삭제',
        description: '1:1 문의를 삭제합니다. (소프트 딜리트)',
    })
    @ApiOkResponse({
        description: '1:1 문의 삭제 성공',
        type: InquiryDTO,
    })
    async remove(@Param('id') id: string): Promise<InquiryDTO> {
        const inquiry = await this.inquiryService.remove(id);

        return plainToInstance(InquiryDTO, inquiry);
    }
}
