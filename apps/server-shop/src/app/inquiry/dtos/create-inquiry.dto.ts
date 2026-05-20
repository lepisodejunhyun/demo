import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateInquiryDto {
    @ApiProperty({ description: '문의 제목' })
    @IsNotEmpty({ message: '제목은 필수 입력 항목입니다.' })
    @IsString()
    @MaxLength(100, { message: '제목은 최대 100자 이하이어야 합니다.' })
    title: string;

    @ApiProperty({ description: '문의 내용' })
    @IsNotEmpty({ message: '내용은 필수 입력 항목입니다.' })
    @IsString()
    @MaxLength(2000, { message: '내용은 최대 2000자 이하이어야 합니다.' })
    content: string;
}
