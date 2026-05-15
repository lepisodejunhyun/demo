import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class MemberDTO {
  @ApiProperty({ description: '회원 고유 식별자' })
  @Expose()
  id: string;

  @ApiProperty({ description: '이메일' })
  @Expose()
  email: string;

  @ApiProperty({ description: '회원 이름' })
  @Expose()
  name: string;

  @ApiProperty({ description: '가입일' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: '삭제일', required: false, nullable: true })
  @Expose()
  deletedAt: Date | null;
}
