import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";
import { AttachmentDto } from "../../common/dtos/attachment.dto";
import { InquiryStatus } from "@prisma/client";

@Exclude()
export class InquiryDto {
    @ApiProperty({
        description: '1:1 문의 고유 식별자'
    })
    @Expose()
    id: string;

    @ApiProperty({
        description: '문의 제목'
    })
    @Expose()
    title: string;

    @ApiProperty({
        description: '문의 내용'
    })
    @Expose()
    content: string;

    @ApiProperty({
        description: '답변 상태',
        enum: InquiryStatus,
    })
    @Expose()
    status: InquiryStatus;

    @ApiProperty({
        description: '답변 내용',
        required: false,
        nullable: true,
    })
    @Expose()
    answer: string | null;

    @ApiProperty({
        description: '답변 시각',
        required: false,
        nullable: true,
    })
    @Expose()
    answeredAt: Date | null;

    @ApiProperty({
        description: '답변자 admin id',
        required: false,
        nullable: true,
    })
    @Expose()
    answeredBy: string | null;

    @ApiProperty({
        description: '문의 등록일'
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
        description: '문의 수정일'
    })
    @Expose()
    updatedAt: Date;

    @ApiProperty({
        description: '작성자 이름'
    })
    @Expose()
    authorName: string;

    @ApiProperty({
        description: '작성자 이메일'
    })
    @Expose()
    authorEmail: string;

    @ApiProperty({
        description: '첨부 이미지 목록',
        type: [AttachmentDto],
    })
    @Expose()
    @Type(() => AttachmentDto)
    images: AttachmentDto[];
}
