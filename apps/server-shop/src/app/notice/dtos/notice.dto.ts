import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class NoticeDto {
    @ApiProperty({ description: "공지사항 식별자" })
    @Expose()
    id: string;

    @ApiProperty({ description: "제목" })
    @Expose()
    title: string;

    @ApiProperty({ description: "내용" })
    @Expose()
    content: string;

    @ApiProperty({ description: "생성 일시" })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: "수정 일시" })
    @Expose()
    updatedAt: Date;
}
