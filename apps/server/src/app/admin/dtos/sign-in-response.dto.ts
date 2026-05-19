import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";
import { AdminDto } from "./admin.dto";

@Exclude()
export class SignInResponseDto {
    @ApiProperty({
        description: 'Access Token (짧은 수명)',
    })
    @Expose()
    accessToken: string;

    @ApiProperty({
        description: '관리자 정보',
        type: AdminDto,
    })
    @Expose()
    @Type(() => AdminDto)
    admin: AdminDto;
}
