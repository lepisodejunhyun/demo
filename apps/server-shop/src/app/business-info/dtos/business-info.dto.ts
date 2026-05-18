import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class BusinessInfoDTO {
    @ApiProperty({
        description: '사업자 정보 고유 식별자'
    })
    @Expose()
    id: string;

    @ApiProperty({
        description: '상호명'
    })
    @Expose()
    name: string;

    @ApiProperty({
        description: '대표자명'
    })
    @Expose()
    representativeName: string;

    @ApiProperty({
        description: '사업자등록번호'
    })
    @Expose()
    registrationNumber: string;

    @ApiProperty({
        description: '주소'
    })
    @Expose()
    address: string;

    @ApiProperty({
        description: '연락처'
    })
    @Expose()
    contactNumber: string;

    @ApiProperty({
        description: '이메일'
    })
    @Expose()
    email: string;
}
