import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class PreRegistrationCreateDTO {
    @ApiProperty({
        description: '연결할 행사 id (사전 등록 가능 기간 내인지 서버에서 검증)',
    })
    @IsNotEmpty({ message: '행사는 필수 선택 항목입니다.' })
    @IsUUID()
    eventId: string;

    @ApiProperty({
        description: '연결할 회원 id (비회원 등록 시 생략)',
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsUUID()
    memberId?: string;

    @ApiProperty({
        description: '신청자 이름 (최대 20자)',
    })
    @IsNotEmpty({ message: '신청자 이름은 필수 입력 항목입니다.' })
    @IsString({})
    @MaxLength(20, { message: '신청자 이름은 최대 20자까지 입력 가능합니다.' })
    applicantName: string;

    @ApiProperty({
        description: '연락처 (최대 13자)',
    })
    @IsNotEmpty({ message: '연락처는 필수 입력 항목입니다.' })
    @IsString({})
    @MaxLength(13, { message: '연락처는 최대 13자까지 입력 가능합니다.' })
    contactNumber: string;

    @ApiProperty({
        description: '동의한 약관 ID 목록',
        type: [String],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    agreedTermsIds?: string[];
}
