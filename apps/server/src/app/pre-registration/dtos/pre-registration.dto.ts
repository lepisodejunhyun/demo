import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";

@Exclude()
export class TermsAgreementItemDto {
    @ApiProperty({ description: '약관 ID' })
    @Expose()
    termsId: string;

    @ApiProperty({ description: '약관 제목' })
    @Expose()
    termsTitle: string;

    @ApiProperty({ description: '필수 여부' })
    @Expose()
    isRequired: boolean;

    @ApiProperty({ description: '동의 일시' })
    @Expose()
    agreedAt: Date;
}

@Exclude()
export class PreRegistrationDto {
    @ApiProperty({ description: '사전 등록 고유 식별자' })
    @Expose()
    id: string;

    @ApiProperty({ description: '연결된 행사 id' })
    @Expose()
    eventId: string;

    @ApiProperty({ description: '연결된 행사명' })
    @Expose()
    eventTitle: string;

    @ApiProperty({ description: '연결된 회원 id', required: false, nullable: true })
    @Expose()
    memberId: string | null;

    @ApiProperty({ description: '연결된 회원 이름', required: false, nullable: true })
    @Expose()
    memberName: string | null;

    @ApiProperty({ description: '신청자 이름' })
    @Expose()
    applicantName: string;

    @ApiProperty({ description: '연락처' })
    @Expose()
    contactNumber: string;

    @ApiProperty({ description: '약관 동의 이력', type: [TermsAgreementItemDto], required: false })
    @Expose()
    @Type(() => TermsAgreementItemDto)
    agreements: TermsAgreementItemDto[];

    @ApiProperty({ description: '신청일시' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: '수정일시' })
    @Expose()
    updatedAt: Date;
}
