import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateFaqDto {
    @ApiProperty({ description: 'FAQ 질문' })
    @IsNotEmpty({ message: 'FAQ 질문은 필수 입력 항목입니다.' })
    @IsString({})
    @MaxLength(100)
    question: string;

    @ApiProperty({ description: 'FAQ 답변' })
    @IsNotEmpty({ message: 'FAQ 답변은 필수 입력 항목입니다.' })
    @IsString({})
    @MaxLength(2000)
    answer: string;
}