import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

/**
 * 사전 등록 가능한 행사 목록 응답 Dto (등록 폼 dropdown용)
 * 사전 등록 기간이 설정되어 있고, 현재 시각이 그 기간 내인 행사만 표시.
 */
@Exclude()
export class AvailableEventDto {
    @ApiProperty({ description: '행사 id' })
    @Expose()
    id: string;

    @ApiProperty({ description: '행사명' })
    @Expose()
    title: string;

    @ApiProperty({ description: '행사 시작일' })
    @Expose()
    startDate: Date;

    @ApiProperty({ description: '행사 종료일' })
    @Expose()
    endDate: Date;

    @ApiProperty({ description: '사전 등록 시작일' })
    @Expose()
    preRegStartDate: Date;

    @ApiProperty({ description: '사전 등록 종료일' })
    @Expose()
    preRegEndDate: Date;
}
