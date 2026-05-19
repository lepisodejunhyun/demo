import { ApiProperty } from "@nestjs/swagger";

export class PageInfoDto {
    @ApiProperty({
        description: '현재 페이지 번호'
    })
    page: number;

    @ApiProperty({
        description: '페이지당 항목 수'
    })
    limit: number;

    @ApiProperty({
        description: '현재 페이지 항목 수'
    })
    pageItems: number;

    @ApiProperty({
        description: '전체 항목 수'
    })
    totalItems: number;

    @ApiProperty({
        description: '전체 페이지 수'
    })
    totalPages: number;
}