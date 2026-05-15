import { ApiProperty } from "@nestjs/swagger";
import { PageInfoDTO } from "./page-info.dto";

export class OffsetPaginationDTO<T> {
    @ApiProperty({
        isArray: true
    })
    items: T[];

    @ApiProperty({
        type: PageInfoDTO
    })
    pageInfo: PageInfoDTO;
}