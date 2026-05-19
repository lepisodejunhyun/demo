import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OffsetPaginationDto, PageInfoDto, PaginationQueryDto } from "../../libs/dtos";
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { TermsService } from "./terms.service";
import { TermsDto } from "./dtos/terms.dto";
import { plainToInstance } from "class-transformer";
import { CreateTermsDto } from "./dtos/create-terms.dto";
import { JwtAuthGuard } from "../admin/guards/jwt-auth.guard";

@ApiTags('terms')
@ApiExtraModels(PageInfoDto)
@UseGuards(JwtAuthGuard)
@Controller('terms')
export class TermsController {
    constructor(
        private readonly termsService: TermsService
    ) { }

    @Post('create')
    @ApiOperation({
        summary: '약관 신규 등록',
        description: '제목과 내용을 입력하여 약관을 등록합니다.',
    })
    @ApiOkResponse({
        description: '약관 신규 등록 성공',
        type: TermsDto,
    })
    async create(@Body() data: CreateTermsDto): Promise<TermsDto> {
        const terms = await this.termsService.create(data);

        return plainToInstance(TermsDto, terms);
    }

    @Get()
    @ApiOperation({
        summary: '약관 전체 조회',
        description: '등록된 약관 목록을 최신순으로 조회합니다. (deletedAt이 null인 약관만)',
    })
    @ApiResponse({
        description: '약관 목록 조회 성공',
        schema: {
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/TermsDto' },
                },
                pageInfo: {
                    $ref: '#/components/schemas/PageInfoDto',
                },
            },
        },
    })
    async findAll(@Query() query: PaginationQueryDto): Promise<OffsetPaginationDto<TermsDto>> {
        const result = await this.termsService.findAll(query.page, query.limit);

        return {
            items: plainToInstance(TermsDto, result.items),
            pageInfo: result.pageInfo,
        };
    }

    @Get(':id')
    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '약관 상세 조회',
        description: '약관 제목, 내용, 수정일시를 조회합니다.',
    })
    @ApiOkResponse({
        description: '약관 상세 조회 성공',
        type: TermsDto,
    })
    async findById(@Param('id') id: string): Promise<TermsDto> {
        const terms = await this.termsService.findById(id);

        return plainToInstance(TermsDto, terms);
    }    

    @Patch(':id')
    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '약관 수정',
        description: '기존 약관의 제목, 내용을 수정합니다.',
    })
    @ApiOkResponse({
        description: '약관 수정 성공',
        type: TermsDto,
    })
    async update(@Param('id') id: string, @Body() data: CreateTermsDto): Promise<TermsDto> {
        const terms = await this.termsService.update(id, data);

        return plainToInstance(TermsDto, terms);
    }

    @Delete(':id')
    @ApiParam({
        name: 'id',
        type: String,
    })
    @ApiOperation({
        summary: '약관 삭제',
        description: '선택한 약관을 삭제합니다. (소프트 딜리트)',
    })
    @ApiOkResponse({
        description: '약관 삭제 성공',
        type: TermsDto,
    })
    async remove(@Param('id') id: string): Promise<TermsDto> {
        const terms = await this.termsService.remove(id);

        return plainToInstance(TermsDto, terms);
    }
}
