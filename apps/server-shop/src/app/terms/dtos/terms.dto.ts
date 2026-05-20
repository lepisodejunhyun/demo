import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class TermsDto {
    @ApiProperty({ description: "약관 식별자" })
    @Expose()
    id: string;

    @ApiProperty({ description: "약관 제목" })
    @Expose()
    title: string;

    @ApiProperty({ description: "약관 내용" })
    @Expose()
    content: string;

    @ApiProperty({ description: "필수 여부" })
    @Expose()
    isRequired: boolean;

    @ApiProperty({ description: "생성 일시" })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: "수정 일시" })
    @Expose()
    updatedAt: Date;
}
