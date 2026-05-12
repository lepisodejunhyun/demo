import { ApiProperty } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class AdminDTO {
  @ApiProperty({
    description: '관리자 고유 식별자',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: '이메일(로그인ID)',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: '관리자 이름',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: '관리자 권한 등급',
    enum: AdminRole,
  })
  @Expose()
  role: AdminRole;

  @ApiProperty({
    description: '연속 로그인 실패 횟수',
  })
  @Expose()
  failCount: number;

  @ApiProperty({
    description: '관리자 계정 잠김 시간',
  })
  @Expose()
  lockedUntil: Date | null;

  @ApiProperty({
    description: '관리자 계정 마지막 로그인 시간',
    required: false,
    nullable: true
  })
  @Expose()
  lastLoginAt: Date | null;

  @ApiProperty({
    description: '관리자 계정 생성 시간',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: '관리자 계정 수정 시간',
  })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: '관리자 계정 삭제 시간',
    required: false,
    nullable: true
  })
  @Expose()
  deletedAt: Date | null;
}
