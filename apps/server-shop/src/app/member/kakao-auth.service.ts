import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Member } from '@prisma/client';
import { KakaoTokenResponse, KakaoUserInfo } from './interfaces/kakao.interface';

@Injectable()
export class KakaoAuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * @name getKakaoToken
     * @description 카카오 인가 코드로 Access Token 교환
     * @param {string} code - 카카오 인가 코드
     * @returns {Promise<KakaoTokenResponse>}
     */
    async getKakaoToken(code: string): Promise<KakaoTokenResponse> {
        const res = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: process.env.KAKAO_REST_API_KEY!,
                client_secret: process.env.KAKAO_CLIENT_SECRET!,
                redirect_uri: process.env.KAKAO_REDIRECT_URI!,
                code,
            }),
        });

        if (!res.ok) {
            throw new UnauthorizedException('카카오 토큰 발급에 실패했습니다.');
        }

        return res.json();
    }

    /**
     * @name getKakaoUserInfo
     * @description 카카오 Access Token으로 사용자 정보 조회
     * @param {string} accessToken - 카카오 Access Token
     * @returns {Promise<KakaoUserInfo>}
     */
    async getKakaoUserInfo(accessToken: string): Promise<KakaoUserInfo> {
        const res = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
            throw new UnauthorizedException('카카오 사용자 정보 조회에 실패했습니다.');
        }

        return res.json();
    }

    /**
     * @name handleKakaoLogin
     * @description 카카오 로그인 처리: 기존 회원이면 로그인, 신규면 가입 후 로그인
     * @param {string} code - 카카오 인가 코드
     * @returns {Promise<{ accessToken: string; refreshToken: string; member: Member }>}
     */
    async handleKakaoLogin(code: string): Promise<{ accessToken: string; refreshToken: string; member: Member }> {
        // 1. 인가 코드 → 카카오 토큰
        const kakaoToken = await this.getKakaoToken(code);

        // 2. 카카오 토큰 → 사용자 정보
        const kakaoUser = await this.getKakaoUserInfo(kakaoToken.access_token);

        const kakaoId = String(kakaoUser.id);
        const email = kakaoUser.kakao_account?.email;
        const name = kakaoUser.kakao_account?.profile?.nickname || '카카오 사용자';

        if (!email) {
            throw new UnauthorizedException('카카오 이메일 정보가 필요합니다. 카카오 계정에 이메일을 등록해주세요.');
        }

        // 3. SocialAccount에서 기존 연결 확인
        const existingSocial = await this.prisma.socialAccount.findUnique({
            where: {
                provider_providerId: {
                    provider: 'KAKAO',
                    providerId: kakaoId,
                },
            },
            include: { member: true },
        });

        let member: Member;

        if (existingSocial) {
            // 기존 카카오 연결 → 바로 로그인
            member = existingSocial.member;
        } else {
            // 같은 이메일로 가입된 회원 확인
            const existingMember = await this.prisma.member.findFirst({
                where: { email, deletedAt: null },
            });

            if (existingMember) {
                // 이메일 회원이 있으면 소셜 계정 연결
                await this.prisma.socialAccount.create({
                    data: {
                        memberId: existingMember.id,
                        provider: 'KAKAO',
                        providerId: kakaoId,
                    },
                });
                member = existingMember;
            } else {
                // 완전 신규 → 회원가입 + 소셜 계정 생성
                member = await this.prisma.member.create({
                    data: {
                        email,
                        name,
                        password: null, // 소셜 로그인은 비밀번호 없음
                        socialAccounts: {
                            create: {
                                provider: 'KAKAO',
                                providerId: kakaoId,
                            },
                        },
                    },
                });
            }
        }

        // 4. JWT 발급
        const payload = { sub: member.id, email: member.email };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        return { accessToken, refreshToken, member };
    }
}
