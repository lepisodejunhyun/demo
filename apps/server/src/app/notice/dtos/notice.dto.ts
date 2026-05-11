import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class NoticeDTO {
    @ApiProperty({
        description: '공지사항 고유 식별자'
    })
    @Expose()
    id: string;

    @ApiProperty({
        description: '공지사항 제목'
    })
    @Expose()
    title: string;

    @ApiProperty({
        description: '공지사항 내용'
    })
    @Expose()
    content: string;

    @ApiProperty({
        description: '공지사항 등록일시'
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
        description: '공지사항 수정일시'
    })
    @Expose()
    updatedAt: Date;

    @ApiProperty({
        description: '공지사항 삭제일시'
    })
    @Expose()
    deletedAt: Date | null;
}