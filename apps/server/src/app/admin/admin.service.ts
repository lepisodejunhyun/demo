import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Admin } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminSignInDTO } from "./dtos/admin-sign-in.dto";
import { compareSync } from "bcryptjs";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AdminEvents } from "./admin.const";


@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) { }

  getHello(): string {
    return 'Hello World!';
  }

  async findAll(): Promise<Admin[]> {
    const admins = await this.prisma.admin.findMany({});

    return admins;
  }

  /**
  * @name signIn
  * @description 관리자 로그인
  * @param {AdminSignInDTO} data
  * @returns {Promise<Admin>}
  */
  async signIn(data: AdminSignInDTO): Promise<Admin> {
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

    return admin;
  }

}
