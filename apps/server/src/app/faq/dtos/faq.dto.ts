import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class FaqDto {
    @ApiProperty({
        description: 'FAQ 고유 식별자'
    })
    @Expose()
    id: string;

    @ApiProperty({
        description: 'FAQ 질문'
    })
    @Expose()
    question: string;

    @ApiProperty({
        description: 'FAQ 답변'
    })
    @Expose()
    answer: string;

    @ApiProperty({
        description: 'FAQ 등록일시'
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
        description: 'FAQ 수정일시'
    })
    @Expose()
    updatedAt: Date;

    @ApiProperty({
        description: 'FAQ 삭제일시'
    })
    @Expose()
    deletedAt: Date | null;

}



