import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class BusinessInfoUpdateDTO {
    @ApiProperty({
        description: '상호명 (최대 50자)',
    })
    @IsNotEmpty({ message: '상호명은 필수 입력 항목입니다.' })
    @IsString({})
    @MaxLength(50, { message: '상호명은 최대 50자까지 입력 가능합니다.' })
    name: string;

    @ApiProperty({
        description: '대표자명 (최대 20자)',
    })
    @IsNotEmpty({ message: '대표자명은 필수 입력 항목입니다.' })
    @IsString({})
    @MaxLength(20, { message: '대표자명은 최대 20자까지 입력 가능합니다.' })
    representativeName: string;

    @ApiProperty({
        description: '사업자등록번호 (최대 12자)',
    })
    @IsNotEmpty({ message: '사업자등록번호는 필수 입력 항목입니다.' })
    @IsString({})
    @MaxLength(12, { message: '사업자등록번호는 최대 12자까지 입력 가능합니다.' })
    registrationNumber: string;

    @ApiProperty({
        description: '주소 (최대 200자)',
    })
    @IsNotEmpty({ message: '주소는 필수 입력 항목입니다.' })
    @IsString({})
    @MaxLength(200, { message: '주소는 최대 200자까지 입력 가능합니다.' })
    address: string;

    @ApiProperty({
        description: '연락처 (최대 13자)',
    })
    @IsNotEmpty({ message: '연락처는 필수 입력 항목입니다.' })
    @IsString({})
    @MaxLength(13, { message: '연락처는 최대 13자까지 입력 가능합니다.' })
    contactNumber: string;

    @ApiProperty({
        description: '이메일 (최대 50자, 형식 검증)',
    })
    @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
    @IsString({})
    @MaxLength(50, { message: '이메일은 최대 50자까지 입력 가능합니다.' })
    @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
    email: string;
}
