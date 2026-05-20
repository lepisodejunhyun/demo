import { ApiProperty } from "@nestjs/swagger";
import { PageInfoDto } from "./page-info.dto";

export class OffsetPaginationDto<T> {
    @ApiProperty({
        isArray: true
    })
    items: T[];

    @ApiProperty({
        type: PageInfoDto
    })
    pageInfo: PageInfoDto;
}