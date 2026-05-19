import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class AttachmentDto {
    @ApiProperty({
        description: '첨부파일 고유 식별자'
    })
    @Expose()
    id: string;

    @ApiProperty({
        description: '파일 URL'
    })
    @Expose()
    url: string;

    @ApiProperty({
        description: '원본 파일명',
        required: false,
        nullable: true
    })
    @Expose()
    fileName: string | null;

    @ApiProperty({
        description: '정렬 순서'
    })
    @Expose()
    sortOrder: number;
}
