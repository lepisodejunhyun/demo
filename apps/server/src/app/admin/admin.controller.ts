import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from "./admin.service";
import { plainToInstance } from "class-transformer";
import { AdminDTO } from "./dtos/admin.dto";
import { AdminSignInDTO } from "./dtos/admin-sign-in.dto";

@ApiTags('Admin')
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) { };

  @Get('hello')
  @ApiOperation({ summary: '인사말' })
  gethello() {
    return this.adminService.getHello();
  }

  @Get()
  @ApiOperation({
    summary: '관리자 전체 조회',
    description: '모든 관리자를 조회합니다.',
  })
  @ApiOkResponse({
    description: '관리자 목록 조회 성공',
    type: AdminDTO,
    isArray: true,
  })
  async findAll(): Promise<AdminDTO[]> {
    const admins = await this.adminService.findAll();

    return plainToInstance(AdminDTO, admins);

  }

  @Post('signin')
  @ApiOperation({
    summary: '관리자 로그인',
    description: '관리자를 로그인합니다.',
  })
  @ApiOkResponse({
    description: '로그인 성공',
    type: AdminDTO,
  })
  async signin(@Body() data: AdminSignInDTO): Promise<AdminDTO> {
    const admin = await this.adminService.signIn(data);

    return plainToInstance(AdminDTO, admin);

  }

}
