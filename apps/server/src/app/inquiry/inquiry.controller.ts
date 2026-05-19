import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OffsetPaginationDto, PageInfoDto, PaginationQueryDto } from "../../libs/dtos";
import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { InquiryService } from "./inquiry.service";
import { InquiryDto } from "./dtos/inquiry.dto";
import { plainToInstance } from "class-transformer";
import { UpdateInquiryDto } from "./dtos/update-inquiry.dto";
import { JwtAuthGuard } from "../admin/guards/jwt-auth.guard";

@ApiTags('inquiry')
@ApiExtraModels(PageInfoDto)
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
                    items: { $ref: '#/components/schemas/InquiryDto' },
                },
                pageInfo: {
                    $ref: '#/components/schemas/PageInfoDto',
                },
            },
        },
    })
    async findAll(@Query() query: PaginationQueryDto): Promise<OffsetPaginationDto<InquiryDto>> {
        const result = await this.inquiryService.findAll(query.page, query.limit);

        return {
            items: plainToInstance(InquiryDto, result.items),
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
        type: InquiryDto,
    })
    async findById(@Param('id') id: string): Promise<InquiryDto> {
        const inquiry = await this.inquiryService.findById(id);

        return plainToInstance(InquiryDto, inquiry);
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
        type: InquiryDto,
    })
    async update(@Param('id') id: string, @Body() data: UpdateInquiryDto): Promise<InquiryDto> {
        const inquiry = await this.inquiryService.update(id, data);

        return plainToInstance(InquiryDto, inquiry);
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
        type: InquiryDto,
    })
    async remove(@Param('id') id: string): Promise<InquiryDto> {
        const inquiry = await this.inquiryService.remove(id);

        return plainToInstance(InquiryDto, inquiry);
    }
}
