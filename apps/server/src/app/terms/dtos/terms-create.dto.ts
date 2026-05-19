import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

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
    @MaxLength(10000, { message: '약관 내용은 최대 10000자까지 입력 가능합니다.' })
    content: string;

    @ApiProperty({
        description: '필수 약관 여부 (기본값: true)',
        required: false,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isRequired?: boolean;
}
