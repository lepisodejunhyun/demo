import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";
import { MemberDto } from "./member.dto";

@Exclude()
export class SignInResponseDto {
    @ApiProperty({ description: 'Access Token' })
    @Expose()
    accessToken: string;

    @ApiProperty({ description: '회원 정보', type: MemberDto })
    @Expose()
    @Type(() => MemberDto)
    member: MemberDto;
}
