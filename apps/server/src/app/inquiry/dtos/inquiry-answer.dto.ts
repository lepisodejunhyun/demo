import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class InquiryAnswerDTO {
    @ApiProperty({
        description: '답변 내용 (최대 2000자)',
    })
    @IsNotEmpty({ message: '답변 내용은 필수 입력 항목입니다.' })
    @IsString({})
    @MaxLength(2000, { message: '답변 내용은 최대 2000자까지 입력 가능합니다.' })
    answer: string;
}
