import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class NoticeCreateDTO {
    @ApiProperty({ description: '공지사항 제목' })
    @IsNotEmpty({ message: '공지사항 제목은 필수 입력 항목입니다. ' })
    @IsString()
    @MaxLength(200)
    title: string;

    @ApiProperty({ description: '공지사항 내용' })
    @IsNotEmpty({ message: '공지사항 내용은 필수 입력 항목입니다.' })
    @IsString()
    @MaxLength(5000)
    content: string;
}