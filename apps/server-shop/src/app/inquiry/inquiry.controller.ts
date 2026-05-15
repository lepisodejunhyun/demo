import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';
import { OffsetPaginationDTO, PageInfoDTO, PaginationQueryDTO } from '../../libs/dtos';
import { JwtAuthGuard } from '../member/guards/jwt-auth.guard';
import { InquiryDTO } from './dtos/inquiry.dto';
import { InquiryCreateDTO } from './dtos/inquiry-create.dto';
import { InquiryService } from './inquiry.service';

@ApiTags('inquiry')
@ApiExtraModels(PageInfoDTO)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('inquiry')
export class InquiryController {
    constructor(private readonly inquiryService: InquiryService) {}

    @Get()
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
                    items: { $ref: '#/components/schemas/InquiryDTO' },
                },
                pageInfo: {
                    $ref: '#/components/schemas/PageInfoDTO',
                },
            },
        },
    })
    async findAll(@Req() req: Request, @Query() query: PaginationQueryDTO): Promise<OffsetPaginationDTO<InquiryDTO>> {
        const memberId = (req.user as any).id;
        const result = await this.inquiryService.findAllByMemberId(memberId, query.page, query.limit);

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
        summary: '내 1:1 문의 정보 상세 조회',
        description: '본인이 작성한 특정 1:1 문의 정보를 상세 조회 합니다.',
    })
    @ApiOkResponse({
        description: '문의 정보 상세 조회 성공',
        type: InquiryDTO,
    })
    async findById(@Req() req: Request, @Param('id') id: string): Promise<InquiryDTO> {
        const memberId = (req.user as any).id;
        const inquiry = await this.inquiryService.findByIdAndMemberId(id, memberId);
        
        return plainToInstance(InquiryDTO, inquiry);
    }

    @Post('create')
    @ApiOperation({
        summary: '1:1 문의 작성',
        description: '로그인한 회원이 1:1 문의를 작성합니다.',
    })
    @ApiOkResponse({
        description: '문의 작성 성공',
        type: InquiryDTO,
    })
    async create(@Req() req: Request, @Body() data: InquiryCreateDTO): Promise<InquiryDTO> {
        const memberId = (req.user as any).id;
        const inquiry = await this.inquiryService.create(memberId, data.title, data.content);

        return plainToInstance(InquiryDTO, inquiry);
    }
}
