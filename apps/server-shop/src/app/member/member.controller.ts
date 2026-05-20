import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MemberService } from "./member.service";
import { plainToInstance } from "class-transformer";
import { MemberDto } from "./dtos/member.dto";
import { MemberSignUpDto } from "./dtos/member-signup.dto";
import { MemberSignInDto } from "./dtos/member-signin.dto";
import { SignInResponseDto } from "./dtos/sign-in-response.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Request, Response } from "express";

@ApiTags('Member')
@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) { }

  @ApiOperation({
    summary: '회원가입',
    description: '이메일, 비밀번호, 이름으로 회원가입합니다.',
  })
  @ApiOkResponse({
    description: '회원가입 성공',
    type: MemberDto,
  })
  @Post('signup')
  async signup(@Body() data: MemberSignUpDto): Promise<MemberDto> {
    const member = await this.memberService.signUp(data);
    return plainToInstance(MemberDto, member);
  }

  @ApiOperation({
    summary: '로그인',
    description: 'Access Token은 응답 body, Refresh Token은 httpOnly 쿠키로 전달됩니다.',
  })
  @ApiOkResponse({
    description: '로그인 성공',
    type: SignInResponseDto,
  })
  @Post('signin')
  async signin(@Body() data: MemberSignInDto, @Res({ passthrough: true }) res: Response,): Promise<SignInResponseDto> {
    const { accessToken, refreshToken, member } = await this.memberService.signIn(data);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return plainToInstance(SignInResponseDto, { accessToken, member });
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

    const { accessToken } = await this.memberService.refreshAccessToken(refreshToken);

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
    summary: '내 정보 조회',
    description: 'Access Token으로 현재 로그인된 회원 정보를 조회합니다.',
  })
  @ApiOkResponse({
    description: '내 정보 조회 성공',
    type: MemberDto,
  })
  @Get('me')
  async me(@Req() req: Request): Promise<MemberDto> {
    return plainToInstance(MemberDto, req.user);
  }
}
