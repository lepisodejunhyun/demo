import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";
import { MemberDTO } from "./member.dto";

@Exclude()
export class SignInResponseDTO {
    @ApiProperty({ description: 'Access Token' })
    @Expose()
    accessToken: string;

    @ApiProperty({ description: '회원 정보', type: MemberDTO })
    @Expose()
    @Type(() => MemberDTO)
    member: MemberDTO;
}
