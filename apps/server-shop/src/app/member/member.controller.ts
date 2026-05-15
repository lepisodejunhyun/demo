import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MemberService } from "./member.service";
import { plainToInstance } from "class-transformer";
import { MemberDTO } from "./dtos/member.dto";
import { MemberSignUpDTO } from "./dtos/member-signup.dto";
import { MemberSignInDTO } from "./dtos/member-signin.dto";
import { SignInResponseDTO } from "./dtos/sign-in-response.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Request, Response } from "express";

@ApiTags('Member')
@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) { }

  @Post('signup')
  @ApiOperation({
    summary: '회원가입',
    description: '이메일, 비밀번호, 이름으로 회원가입합니다.',
  })
  @ApiOkResponse({
    description: '회원가입 성공',
    type: MemberDTO,
  })
  async signup(@Body() data: MemberSignUpDTO): Promise<MemberDTO> {
    const member = await this.memberService.signUp(data);
    return plainToInstance(MemberDTO, member);
  }

  @Post('signin')
  @ApiOperation({
    summary: '로그인',
    description: 'Access Token은 응답 body, Refresh Token은 httpOnly 쿠키로 전달됩니다.',
  })
  @ApiOkResponse({
    description: '로그인 성공',
    type: SignInResponseDTO,
  })
  async signin(
    @Body() data: MemberSignInDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignInResponseDTO> {
    const { accessToken, refreshToken, member } = await this.memberService.signIn(data);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return plainToInstance(SignInResponseDTO, { accessToken, member });
  }

  @Post('refresh')
  @ApiOperation({
    summary: '토큰 갱신',
    description: 'Refresh Token으로 새 Access Token을 발급합니다.',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh Token이 없습니다.' });
      return;
    }

    const { accessToken } = await this.memberService.refreshAccessToken(refreshToken);

    return { accessToken };
  }

  @Post('logout')
  @ApiOperation({
    summary: '로그아웃',
    description: 'Refresh Token 쿠키를 삭제합니다.',
  })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return { message: '로그아웃 되었습니다.' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '내 정보 조회',
    description: 'Access Token으로 현재 로그인된 회원 정보를 조회합니다.',
  })
  @ApiOkResponse({
    description: '내 정보 조회 성공',
    type: MemberDTO,
  })
  async me(@Req() req: Request): Promise<MemberDTO> {
    return plainToInstance(MemberDTO, req.user);
  }
}
