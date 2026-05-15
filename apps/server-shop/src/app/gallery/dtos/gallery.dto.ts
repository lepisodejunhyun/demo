import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

export class AttachmentDTO {
    @ApiProperty({ description: "첨부파일 식별자" })
    @Expose()
    id: string;

    @ApiProperty({ description: "파일 URL" })
    @Expose()
    url: string;

    @ApiProperty({ description: "정렬 순서", required: false })
    @Expose()
    sortOrder?: number;
}

export class GalleryDTO {
    @ApiProperty({ description: "갤러리 식별자" })
    @Expose()
    id: string;

    @ApiProperty({ description: "제목" })
    @Expose()
    title: string;

    @ApiProperty({ description: "내용", required: false })
    @Expose()
    content?: string;

    @ApiProperty({ description: "생성 일시" })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: "수정 일시" })
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
        type: [AttachmentDTO]
    })
    @Expose()
    @Type(() => AttachmentDTO)
    images: AttachmentDTO[];
}
