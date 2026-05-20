import { Controller, Post, Body, Res } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { KakaoAuthService } from './kakao-auth.service';
import { SignInResponseDto } from './dtos/sign-in-response.dto';
import { KakaoLoginDto } from './dtos/kakao-login.dto';

@ApiTags('Auth')
@Controller('auth')
export class KakaoAuthController {
    constructor(private readonly kakaoAuthService: KakaoAuthService) {}

    @ApiOperation({
        summary: '카카오 로그인',
        description: '카카오 인가 코드를 받아 로그인/회원가입을 처리합니다.',
    })
    @ApiOkResponse({
        description: '카카오 로그인 성공',
        type: SignInResponseDto,
    })
    @Post('kakao')
    async kakaoLogin(
        @Body() data: KakaoLoginDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<SignInResponseDto> {
        const { accessToken, refreshToken, member } = await this.kakaoAuthService.handleKakaoLogin(data.code);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        return plainToInstance(SignInResponseDto, { accessToken, member });
    }
}
