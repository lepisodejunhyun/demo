import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class NoticeCreateDTO {
    @ApiProperty({ description: '공지사항 제목' })
    @IsNotEmpty({ message: '공지사항 제목은 필수 입력 항목입니다. '})
    @IsString()
    title: string;

    @ApiProperty({ description: '공지사항 내용' })
    @IsNotEmpty({ message: '공지사항 내용은 필수 입력 항목입니다.' })
    @IsString()
    content: string;
}