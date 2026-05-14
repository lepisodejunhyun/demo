import { Logger, Module, OnModuleInit } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PrismaService } from "../../prisma/prisma.service";
import { hashSync } from "bcryptjs"
import { AdminRole } from '@prisma/client';
import { AdminListener } from "./admin.listener";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminListener, JwtStrategy],
  exports: [JwtModule, PassportModule],
})
export class AdminModule implements OnModuleInit {
  private readonly logger = new Logger(AdminModule.name);

  private readonly defaultAdminEmail = process.env.DEFAULT_ADMIN_USERNAME || '';
  private readonly defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || '';

  constructor(private readonly prisma: PrismaService) { }

  async onModuleInit() {
    try {

      if (!this.defaultAdminEmail || !this.defaultAdminPassword) {
        this.logger.warn('최고 관리자 이메일 또는 비밀번호가 설정되지 않았습니다. 환경 변수를 확인하세요.');
        return;
      }

      const existingAdmin = await this.prisma.admin.findFirst({
        where: { email: this.defaultAdminEmail },
      });

      if (existingAdmin) {
        if (existingAdmin.deletedAt) {
          this.logger.warn(`최고 관리자(${this.defaultAdminEmail})가 삭제된 상태입니다. 수동으로 복구가 필요합니다.`);
        } else {
          this.logger.log(
            `최고 관리자(${this.defaultAdminEmail})가 이미 존재합니다.`
          );
        }
        return;
      }

      await this.prisma.admin.create({
        data: {
          email: this.defaultAdminEmail,
          password: hashSync(this.defaultAdminPassword, 10),
          name: '최고 관리자',
          role: AdminRole.최고관리자,
        }
      })
    } catch (error) {
      this.logger.error('최고 관리자 생성 중 에러 발생:', error);
    }
  }
}
