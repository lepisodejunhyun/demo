import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from "./admin.service";
import { plainToInstance } from "class-transformer";
import { AdminDto } from "./dtos/admin.dto";
import { SignInAdminDto } from "./dtos/sign-in-admin.dto";
import { SignInResponseDto } from "./dtos/sign-in-response.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Request, Response } from "express";

@ApiTags('Admin')
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) { };

  @ApiOperation({
    summary: '관리자 로그인',
    description: '관리자를 로그인합니다. Access Token은 응답 body, Refresh Token은 httpOnly 쿠키로 전달됩니다.',
  })
  @ApiOkResponse({
    description: '로그인 성공',
    type: SignInResponseDto,
  })
  @Post('signin')
  async signin(@Body() data: SignInAdminDto, @Res({ passthrough: true }) res: Response,): Promise<SignInResponseDto> {
    const { accessToken, refreshToken, admin } = await this.adminService.signIn(data);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return plainToInstance(SignInResponseDto, { accessToken, admin });
  }

  @ApiOperation({
    summary: '토큰 갱신',
    description: 'Refresh Token으로 새 Access Token을 발급합니다.',
  })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string } | void> {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh Token이 없습니다.' });
      return;
    }

    const { accessToken } = await this.adminService.refreshAccessToken(refreshToken);

    return { accessToken };
  }

  @ApiOperation({
    summary: '로그아웃',
    description: 'Refresh Token 쿠키를 삭제합니다.',
  })
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response): Promise<{ message: string }> {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return { message: '로그아웃 되었습니다.' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '관리자 전체 조회',
    description: '모든 관리자를 조회합니다.',
  })
  @ApiOkResponse({
    description: '관리자 목록 조회 성공',
    type: AdminDto,
    isArray: true,
  })
  @Get()
  async findAll(): Promise<AdminDto[]> {
    const admins = await this.adminService.findAll();

    return plainToInstance(AdminDto, admins);

  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '내 정보 조회',
    description: 'Access Token으로 현재 로그인된 관리자 정보를 조회합니다.',
  })
  @ApiOkResponse({
    description: '내 정보 조회 성공',
    type: AdminDto,
  })
  @Get('me')
  async me(@Req() req: Request): Promise<AdminDto> {
    return plainToInstance(AdminDto, req.user);
  }

}
