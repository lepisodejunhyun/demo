import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MemberSignUpDTO } from "./dtos/member-signup.dto";
import { MemberSignInDTO } from "./dtos/member-signin.dto";
import { compareSync, hashSync } from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { Member } from "@prisma/client";

@Injectable()
export class MemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * @name signUp
   * @description 회원 가입 (이메일 중복 검증 포함)
   * @param {MemberSignUpDTO} data
   * @returns {Promise<Member>}
   */
  async signUp(data: MemberSignUpDTO): Promise<Member> {
    const existing = await this.prisma.member.findFirst({
      where: { email: data.email, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const member = await this.prisma.member.create({
      data: {
        email: data.email,
        password: hashSync(data.password, 10),
        name: data.name,
      },
    });

    return member;
  }

  /**
   * @name signIn
   * @description 회원 로그인 — Access Token + Refresh Token 발급
   * @param {MemberSignInDTO} data
   * @returns {Promise<{ accessToken: string; refreshToken: string; member: Member }>}
   */
  async signIn(data: MemberSignInDTO): Promise<{ accessToken: string; refreshToken: string; member: Member }> {
    const { email, password } = data;

    const member = await this.prisma.member.findFirst({
      where: { email, deletedAt: null },
    });

    if (!member) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    if (!member.password) {
      throw new UnauthorizedException('소셜 로그인으로 가입된 계정입니다. 소셜 로그인을 이용해주세요.');
    }

    const isPasswordValid = compareSync(password, member.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const payload = { sub: member.id, email: member.email };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken, member };
  }

  /**
   * @name refreshAccessToken
   * @description Refresh Token으로 새 Access Token 발급
   * @param {string} refreshToken
   * @returns {Promise<{ accessToken: string }>}
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const member = await this.prisma.member.findFirst({
        where: { id: payload.sub, deletedAt: null },
      });

      if (!member) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      const newPayload = { sub: member.id, email: member.email };
      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '1h' });

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh Token이 만료되었습니다. 다시 로그인해주세요.');
    }
  }
}
