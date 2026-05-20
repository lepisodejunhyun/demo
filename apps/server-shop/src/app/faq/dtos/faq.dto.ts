import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class FaqDto {
    @ApiProperty({ description: "FAQ 식별자" })
    @Expose()
    id: string;

    @ApiProperty({ description: "질문" })
    @Expose()
    question: string;

    @ApiProperty({ description: "답변" })
    @Expose()
    answer: string;

    @ApiProperty({ description: "생성 일시" })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: "수정 일시" })
    @Expose()
    updatedAt: Date;
}
