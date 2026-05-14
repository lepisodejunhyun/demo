import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";
import { AdminDTO } from "./admin.dto";

@Exclude()
export class SignInResponseDTO {
    @ApiProperty({
        description: 'Access Token (짧은 수명)',
    })
    @Expose()
    accessToken: string;

    @ApiProperty({
        description: '관리자 정보',
        type: AdminDTO,
    })
    @Expose()
    @Type(() => AdminDTO)
    admin: AdminDTO;
}
