import { Logger, Module, OnModuleInit } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PrismaService } from "../../prisma/prisma.service";
import { hashSync} from "bcryptjs"
import { AdminRole } from '@prisma/client';
import { AdminListener } from "./admin.listener";


@Module({
  imports: [], // 이 모듈에서 필요로 하는 다른 외부 모듈들을 가져오는 곳
  controllers: [AdminController], // 클라이언트의 요청(URL)을 받는 입구
  providers: [AdminService, AdminListener], // 실제 비즈니스 로직을 수행하는 서비스들
})

export class AdminModule implements OnModuleInit {
  private readonly logger = new Logger(AdminModule.name);
  private readonly defaultAdminEmail = process.env.DEFAULT_ADMIN_USERNAME || '';
  private readonly defaultAdminpassword = process.env.DEFAULT_ADMIN_PASSWORD || '';

  /**
   * [ 의존성 주입 Dependency Injection) ]
   * 1. 개념: 클래스가 필요한 도구(객체)를 스스로 만들지 않고, 외부(NestJS)로부터 주입받는 것.
   * 2. 문법: constructor(private readonly 변수명: 클래스타입) {}
   * 3. 작동 원리:
   * - @Injectable()이 붙은 클래스(PrismaService 등)를 NestJS가 미리 생성(메모리에 로드).
   * - 이 도구가 필요한 다른 클래서(AdminModule 등)의 생성자(constructor)에 쏙 넣어줌.
   * 4. 장점:
   * - 객체를 매번 새로 생성(new)하지 않아 메모리가 절약됨 (실글톤 패턴).
   * - 클래스 간의 결합도가 낮아져서 코드 수정이나 테스트가 쉬워짐.
   */
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (!this.defaultAdminEmail || !this.defaultAdminpassword) {
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
        password: hashSync(this.defaultAdminpassword, 10),
        name: '최고 관리자',
        role: AdminRole.최고관리자,
      }
    })
  }
}
