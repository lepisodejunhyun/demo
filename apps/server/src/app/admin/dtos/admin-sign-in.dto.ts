import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEmail, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class AdminSignInDTO {
  @ApiProperty({ description: '관리자 이메일' })
  @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @MaxLength(40, { message: '이메일은 최대 40자까지 입력 가능합니다.' })
  email: string;

  @ApiProperty({ description: '관리자 비밀번호' })
  @IsNotEmpty({ message: '비밀번호는 필수 입력 항목입니다.' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(16, { message: '비밀번호는 최대 16자 이하이어야 합니다.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\=\(\'"])/, {
    message: '비밀번호는 영문, 숫자, 특수문자가 모두 포함되어야 합니다.',
  })
  password: string;
}
