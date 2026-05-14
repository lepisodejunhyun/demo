import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class GalleryCreateDTO {
    @ApiProperty({
        description: '갤러리 제목'
    })
    @IsNotEmpty({ message: '갤러리 제목은 필수 입력 항목입니다.' })
    @IsString({})
    @MaxLength(100)
    title: string;

    @ApiProperty({
        description: '갤러리 내용',
        required: false,
        nullable: true,
    })
    @IsString({})
    @IsOptional({})
    @MaxLength(2000)
    content?: string | null;

    @ApiProperty({
        description: '이미지 URL 목록 (최소 1장, 최대 10장)',
        type: [String],
    })
    @IsArray()
    @ArrayMinSize(1, { message: '이미지는 최소 1장 이상 필요합니다.' })
    @ArrayMaxSize(10, { message: '이미지는 최대 10장까지 가능합니다.' })
    @IsString({ each: true })
    imageUrls: string[];
}