import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';
import { OffsetPaginationDto, PageInfoDto, PaginationQueryDto } from '@org/api/pagination';
import { JwtAuthGuard } from '../member/guards/jwt-auth.guard';
import { InquiryDto } from './dtos/inquiry.dto';
import { CreateInquiryDto } from './dtos/create-inquiry.dto';
import { InquiryService } from './inquiry.service';

@ApiTags('inquiry')
@ApiExtraModels(PageInfoDto)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('inquiries')
export class InquiryController {
    constructor(private readonly inquiryService: InquiryService) {}

    @ApiOperation({
        summary: '내 1:1 문의 전체 조회',
        description: "본인이 작성한 1:1 문의 목록을 최신순으로 조회합니다."
    })
    @ApiResponse({
        description: '문의 목록 조회 성공',
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
    @Get()
    async findAll(@Req() req: Request, @Query() query: PaginationQueryDto): Promise<OffsetPaginationDto<InquiryDto>> {
        const memberId = (req.user as any).id;
        const { items, pageInfo } = await this.inquiryService.findAllByMemberId(memberId, query.page, query.limit);

        return {
            items: plainToInstance(InquiryDto, items),
            pageInfo,
        };
    }

    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '내 1:1 문의 정보 상세 조회',
        description: '본인이 작성한 특정 1:1 문의 정보를 상세 조회 합니다.',
    })
    @ApiOkResponse({
        description: '문의 정보 상세 조회 성공',
        type: InquiryDto,
    })
    @Get(':id')
    async findById(@Req() req: Request, @Param('id') id: string): Promise<InquiryDto> {
        const memberId = (req.user as any).id;
        const inquiry = await this.inquiryService.findByIdAndMemberId(id, memberId);
        
        return plainToInstance(InquiryDto, inquiry);
    }

    @ApiOperation({
        summary: '1:1 문의 작성',
        description: '로그인한 회원이 1:1 문의를 작성합니다.',
    })
    @ApiOkResponse({
        description: '문의 작성 성공',
        type: InquiryDto,
    })
    @Post('create')
    async create(@Req() req: Request, @Body() data: CreateInquiryDto): Promise<InquiryDto> {
        const memberId = (req.user as any).id;
        const inquiry = await this.inquiryService.create(memberId, data);

        return plainToInstance(InquiryDto, inquiry);
    }

    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '1:1 문의 수정',
        description: '본인이 작성한 1:1 문의를 수정합니다. 답변 전 상태에서만 가능합니다.',
    })
    @ApiOkResponse({
        description: '문의 수정 성공',
        type: InquiryDto,
    })
    @Patch(':id')
    async update(@Req() req: Request, @Param('id') id: string, @Body() data: CreateInquiryDto): Promise<InquiryDto> {
        const memberId = (req.user as any).id;
        const inquiry = await this.inquiryService.update(id, memberId, data);

        return plainToInstance(InquiryDto, inquiry);
    }
}
