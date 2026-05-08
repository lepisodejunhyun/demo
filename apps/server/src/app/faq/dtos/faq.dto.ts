import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class FaqDTO {
    @ApiProperty({
        description: 'FAQ 고유 식별자'
    })
    @Expose()
    id: string;

}