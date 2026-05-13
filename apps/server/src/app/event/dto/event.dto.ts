import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class EventDTO {
    @ApiProperty({
        description: '행사 정보 고유 식별자'
    })
    @Expose()
    id: string;

    @ApiProperty({
        description: '행사 제목'
    })
    @Expose()
    title: string;

    @ApiProperty({
        description: '행사 내용'
    })
    @Expose()
    content: string;

    @ApiProperty({
        description: '포스터 이미지 URL'
    })
    @Expose()
    posterImage: string | null;

    @ApiProperty({
        description: '행사 장소'
    })
    @Expose()
    location: string | null;

    @ApiProperty({
        description: '행사 문의 연락처'
    })
    @Expose()
    contactNumber: string | null;

    @ApiProperty({
        description: '행사 시작일'
    })
    @Expose()
    startDate: Date;

    @ApiProperty({
        description: '행사 종료일'
    })
    @Expose()
    endDate: Date;

    @ApiProperty({
        description: '운영 시작 시간'
    })
    @Expose()
    operatingStartTime: string;

    @ApiProperty({
        description: '운영 종료 시간'
    })
    @Expose()
    operatingEndTime: string;

    @ApiProperty({
        description: '사전 등록 시작일'
    })
    @Expose()
    preRegStartDate: Date | null;

    @ApiProperty({
        description: '사전 등록 마감일'
    })
    @Expose()
    preRegEndDate: Date | null;

    @ApiProperty({
        description: '행사 정보 등록일'
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
        description: '행사 정보 수정일'
    })
    @Expose()
    updatedAt: Date;
}