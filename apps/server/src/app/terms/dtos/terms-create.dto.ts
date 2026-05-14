import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class TermsCreateDTO {
    @ApiProperty({
        description: '약관 제목 (최대 100자)',
    })
    @IsNotEmpty({ message: '약관 제목은 필수 입력 항목입니다.' })
    @IsString({})
    @MaxLength(100, { message: '약관 제목은 최대 100자까지 입력 가능합니다.' })
    title: string;

    @ApiProperty({
        description: '약관 내용',
    })
    @IsNotEmpty({ message: '약관 내용은 필수 입력 항목입니다.' })
    @IsString({})
    content: string;
}
