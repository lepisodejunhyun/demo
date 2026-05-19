import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

/**
 * 사전 등록 수정 Dto
 * 정책: 행사 변경 불가, 신청자 정보(이름/연락처)만 수정 가능
 */
export class UpdatePreRegistrationDto {
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


}
