import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class TermsDTO {
    @ApiProperty({
        description: '약관 고유 식별자'
    })
    @Expose()
    id: string;

    @ApiProperty({
        description: '약관 제목'
    })
    @Expose()
    title: string;

    @ApiProperty({
        description: '약관 내용'
    })
    @Expose()
    content: string;

    @ApiProperty({
        description: '등록일'
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
        description: '수정일'
    })
    @Expose()
    updatedAt: Date;
}
