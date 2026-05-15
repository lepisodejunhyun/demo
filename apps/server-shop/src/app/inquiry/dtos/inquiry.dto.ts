import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class InquiryDTO {
    @ApiProperty({ description: "문의 식별자" })
    @Expose()
    id: string;

    @ApiProperty({ description: "회원 식별자" })
    @Expose()
    memberId: string;

    @ApiProperty({ description: "제목" })
    @Expose()
    title: string;

    @ApiProperty({ description: "내용" })
    @Expose()
    content: string;

    @ApiProperty({ description: "처리 상태", enum: ['PENDING', 'COMPLETED'] })
    @Expose()
    status: string;

    @ApiProperty({ description: "답변", required: false })
    @Expose()
    answer?: string;

    @ApiProperty({ description: "답변 일시", required: false })
    @Expose()
    answeredAt?: Date;

    @ApiProperty({ description: "답변자", required: false })
    @Expose()
    answeredBy?: string;

    @ApiProperty({ description: "생성 일시" })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: "수정 일시" })
    @Expose()
    updatedAt: Date;
}
