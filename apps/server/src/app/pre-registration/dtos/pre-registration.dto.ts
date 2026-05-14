import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class PreRegistrationDTO {
    @ApiProperty({
        description: '사전 등록 고유 식별자'
    })
    @Expose()
    id: string;

    @ApiProperty({
        description: '연결된 행사 id'
    })
    @Expose()
    eventId: string;

    @ApiProperty({
        description: '연결된 행사명'
    })
    @Expose()
    eventTitle: string;

    @ApiProperty({
        description: '연결된 회원 id (비회원 등록일 경우 null)',
        required: false,
        nullable: true,
    })
    @Expose()
    memberId: string | null;

    @ApiProperty({
        description: '연결된 회원 이름 (비회원 등록일 경우 null)',
        required: false,
        nullable: true,
    })
    @Expose()
    memberName: string | null;

    @ApiProperty({
        description: '신청자 이름'
    })
    @Expose()
    applicantName: string;

    @ApiProperty({
        description: '연락처'
    })
    @Expose()
    contactNumber: string;

    @ApiProperty({
        description: '소속',
        required: false,
        nullable: true,
    })
    @Expose()
    affiliation: string | null;

    @ApiProperty({
        description: '신청일시'
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
        description: '수정일시'
    })
    @Expose()
    updatedAt: Date;
}
