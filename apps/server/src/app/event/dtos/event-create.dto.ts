import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class EventCreateDTO {
    @ApiProperty({
        description: '행사명'
    })
    @IsNotEmpty({ message: '행사명은 필수 입력 항목입니다.' })
    @IsString({})
    title: string;

    @ApiProperty({
        description: '행사 내용'
    })
    @IsNotEmpty({ message: '행사 내용은 필수 입력 항목입니다.' })
    @IsString({})
    content: string;

    @ApiProperty({
        description: '행사 시작일'
    })
    @IsNotEmpty({ message: '행사 시작일은 필수 입력 항목입니다.' })
    @Type(() => Date)
    @IsDate({})
    startDate: Date;

    @ApiProperty({
        description: '행사 종료일'
    })
    @IsNotEmpty({ message: '행사 종료일은 필수 입력 항목입니다.' })
    @Type(() => Date)
    @IsDate({})
    endDate: Date;

    @ApiProperty({
        description: '운영 시작 시간'
    })
    @IsNotEmpty({ message: '운영 시작 시간은 필수 입력 항목입니다.' })
    @IsString({})
    operatingStartTime: string;

    @ApiProperty({
        description: '운영 종료 시간'
    })
    @IsNotEmpty({ message: '운영 종료 시간은 필수 입력 항목입니다.' })
    @IsString({})
    operatingEndTime: string;

    @ApiProperty({
        description: '행사 포스터 이미지',
        required: false,
        nullable: true,
    })
    @IsString({})
    @IsOptional({})
    posterImage?: string | null;

    @ApiProperty({
        description: '행사 장소',
        required: false,
        nullable: true,
    })
    @IsString({})
    @IsOptional({})
    location?: string | null;

    @ApiProperty({
        description: '행사 문의처',
        required: false,
        nullable: true,
    })
    @IsString({})
    @IsOptional({})
    contactNumber?: string | null;

    @ApiProperty({
        description: '사전 등록 시작일',
        required: false,
        nullable: true,
    })
    @Type(() => Date)
    @IsDate({})
    @IsOptional({})
    preRegStartDate?: Date | null;

    @ApiProperty({
        description: '사전 등록 종료일',
        required: false,
        nullable: true,
    })
    @Type(() => Date)
    @IsDate({})
    @IsOptional({})
    preRegEndDate?: Date | null;
}