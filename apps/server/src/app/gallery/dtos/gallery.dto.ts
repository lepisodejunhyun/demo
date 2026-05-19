import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";
import { AttachmentDto } from "../../common/dtos/attachment.dto";

@Exclude()
export class GalleryDto {
    @ApiProperty({
        description: '갤러리 고유 식별자'
    })
    @Expose()
    id: string;

    @ApiProperty({
        description: '갤러리 제목'
    })
    @Expose()
    title: string;

    @ApiProperty({
        description: '갤러리 내용',
        required: false,
        nullable: true,
    })
    @Expose()
    content: string | null;

    @ApiProperty({
        description: '갤러리 등록일'
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
        description: '갤러리 수정일'
    })
    @Expose()
    updatedAt: Date;

    @ApiProperty({
        description: '썸네일 이미지 URL',
        required: false,
        nullable: true,
    })
    @Expose()
    thumbnailUrl: string | null;

    @ApiProperty({
        description: '첨부 이미지 목록',
        type: [AttachmentDto]
    })
    @Expose()
    @Type(() => AttachmentDto)
    images: AttachmentDto[];
}