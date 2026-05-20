import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class PreRegistrationDto {
    @ApiProperty({ description: "사전 등록 식별자" })
    @Expose()
    id: string;

    @ApiProperty({ description: "행사 ID" })
    @Expose()
    eventId: string;

    @ApiProperty({ description: "신청자 이름" })
    @Expose()
    applicantName: string;

    @ApiProperty({ description: "연락처" })
    @Expose()
    contactNumber: string;

    @ApiProperty({ description: "생성 일시" })
    @Expose()
    createdAt: Date;
}
