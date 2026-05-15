import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class KakaoLoginDTO {
    @ApiProperty({ description: '카카오 인가 코드' })
    @IsNotEmpty()
    @IsString()
    code: string;
}
