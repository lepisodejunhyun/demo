import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class PreRegistrationCreateDTO {
    @ApiProperty({ description: "행사 ID" })
    @IsString()
    @IsNotEmpty()
    eventId: string;

    @ApiProperty({ description: "신청자 이름" })
    @IsString()
    @IsNotEmpty()
    applicantName: string;

    @ApiProperty({ description: "연락처" })
    @IsString()
    @IsNotEmpty()
    contactNumber: string;

    @ApiProperty({ description: "동의한 약관 ID 배열", required: false, type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    agreedTermsIds?: string[];
}
