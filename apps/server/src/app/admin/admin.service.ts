import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Admin } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminSignInDTO } from "./dtos/admin-sign-in.dto";
import { compareSync } from "bcryptjs";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AdminEvents } from "./admin.const";
import { JwtService } from "@nestjs/jwt";


@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * @name findAll
   * @description 관리자 전체 목록 조회
   * @returns {Promise<Admin[]>}
   */
  async findAll(): Promise<Admin[]> {
    const admins = await this.prisma.admin.findMany({});

    return admins;
  }

  /**
  * @name signIn
  * @description 관리자 로그인 — Access Token + Refresh Token 발급
  * @param {AdminSignInDTO} data
  * @returns {Promise<{ accessToken: string; refreshToken: string; admin: Admin }>}
  */
  async signIn(data: AdminSignInDTO): Promise<{ accessToken: string; refreshToken: string; admin: Admin }> {
    const { email, password } = data;

    const admin = await this.prisma.admin.findFirst({
      where: {
        email: email,
        deletedAt: null,
      },
    });

    if (!admin) {
      throw new UnauthorizedException({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    const isPasswordValid = compareSync(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    this.eventEmitter.emit(AdminEvents.ADMIN_LOGGED_IN, { admin })

    const payload = { sub: admin.id, email: admin.email };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken, admin };
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

      const admin = await this.prisma.admin.findFirst({
        where: {
          id: payload.sub,
          deletedAt: null,
        },
      });

      if (!admin) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      const newPayload = { sub: admin.id, email: admin.email };
      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '1h' });

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh Token이 만료되었습니다. 다시 로그인해주세요.');
    }
  }

}
