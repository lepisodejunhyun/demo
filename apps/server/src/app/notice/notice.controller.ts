import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { NoticeService } from "./notice.service";
import { NoticeDTO } from "./dtos/notice.dto";
import { plainToInstance } from "class-transformer";

@ApiTags('notice')
@Controller('notice')
export class NoticeController {
    constructor(
        private readonly noticeService: NoticeService
    ) { }

    @Get()
    @ApiOperation({
        summary: '공지사항 전체 조회',
        description: "공지사항 목록을 최신순으로 조회합니다."
    })
    @ApiResponse({
        description: "공지사항 목록 조회 성공",
        type: NoticeDTO,
        isArray: true,
    })
    async findAll(): Promise<NoticeDTO[]> {
        const notices = await this.noticeService.findAll();

        return plainToInstance(NoticeDTO, notices);
    }
}