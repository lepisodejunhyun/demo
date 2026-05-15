import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class EventDTO {
    @ApiProperty({ description: "행사 식별자" })
    @Expose()
    id: string;

    @ApiProperty({ description: "행사명" })
    @Expose()
    title: string;

    @ApiProperty({ description: "행사 상세 내용" })
    @Expose()
    content: string;

    @ApiProperty({ description: "포스터 이미지 URL", required: false })
    @Expose()
    posterImage?: string;

    @ApiProperty({ description: "행사 장소", required: false })
    @Expose()
    location?: string;

    @ApiProperty({ description: "문의처(연락처)", required: false })
    @Expose()
    contactNumber?: string;

    @ApiProperty({ description: "행사 시작일" })
    @Expose()
    startDate: Date;

    @ApiProperty({ description: "행사 종료일" })
    @Expose()
    endDate: Date;

    @ApiProperty({ description: "운영 시작 시간 (HH:mm 형식)" })
    @Expose()
    operatingStartTime: string;

    @ApiProperty({ description: "운영 종료 시간 (HH:mm 형식)" })
    @Expose()
    operatingEndTime: string;

    @ApiProperty({ description: "사전등록 시작일", required: false })
    @Expose()
    preRegStartDate?: Date;

    @ApiProperty({ description: "사전등록 종료일", required: false })
    @Expose()
    preRegEndDate?: Date;

    @ApiProperty({ description: "생성 일시" })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: "수정 일시" })
    @Expose()
    updatedAt: Date;
}
