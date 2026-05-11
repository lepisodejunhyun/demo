/**
 * ============================================================
 * [ NestJS Module이란? ]
 * 관련 있는 Controller, Service, Listener를 하나로 묶는 "그룹".
 * 레고 블록처럼 기능 단위로 묶어서, AppModule에 끼워넣어 사용.
 *
 * 예: AdminModule = AdminController + AdminService + AdminListener
 *     → app.module.ts의 imports에 AdminModule 추가 → 기능 활성화.
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. @Module()      — 모듈 정의 데코레이터 (imports, controllers, providers)
 * 2. OnModuleInit   — 모듈 초기화 시 자동 실행되는 생명주기 훅
 * 3. Logger         — NestJS 내장 로그 도구
 * 4. process.env    — 환경 변수 읽기 (.env 파일)
 * 5. 시딩(Seeding)  — 서버 시작 시 필수 데이터 자동 생성 패턴
 * ============================================================
 */

import { Logger, Module, OnModuleInit } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PrismaService } from "../../prisma/prisma.service";
import { hashSync } from "bcryptjs"
import { AdminRole } from '@prisma/client';
import { AdminListener } from "./admin.listener";

/**
 * @Module({...})
 * → 이 클래스가 NestJS 모듈임을 선언하는 데코레이터.
 *
 * imports:     이 모듈이 의존하는 다른 모듈.
 *              (현재 비어있음 — PrismaModule은 @Global이라 자동 제공됨)
 * controllers: HTTP 요청을 받는 입구들. URL → 함수 매핑.
 * providers:   비즈니스 로직을 수행하는 서비스들.
 *              의존성 주입(DI)으로 다른 곳에서 사용 가능.
 *              AdminListener도 여기 등록해야 이벤트 수신 가능.
 */
@Module({
  imports: [],
  controllers: [AdminController],
  providers: [AdminService, AdminListener],
})

/**
 * [ implements OnModuleInit ]
 * → "이 모듈이 초기화될 때 onModuleInit()을 자동 실행해줘"라는 약속(인터페이스).
 * → 서버 시작 → NestJS가 모든 모듈을 순서대로 초기화 → onModuleInit() 자동 호출.
 * → 용도: DB 초기 데이터 생성(시딩), 외부 서비스 연결 확인 등.
 *
 * [ NestJS 생명주기 훅 순서 ]
 * 1. constructor()              → 모듈 생성
 * 2. onModuleInit()             → 모듈 초기화 ← 여기서 최고관리자 시딩
 * 3. onApplicationBootstrap()   → 앱 부트스트랩 완료
 * 4. ... (서버 실행 중) ...
 * 5. onModuleDestroy()          → 서버 종료 시
 */
export class AdminModule implements OnModuleInit {
  /**
   * [ Logger — NestJS 내장 로그 도구 ]
   * console.log 대신 사용. 레벨별 색상이 다름.
   *   Logger.log()   → 일반 정보 (초록)
   *   Logger.warn()  → 경고 (노랑)
   *   Logger.error() → 에러 (빨강)
   *
   * AdminModule.name → 'AdminModule' 문자열.
   * 로그에 [AdminModule]이 표시되어 어느 모듈에서 찍은 로그인지 바로 알 수 있음.
   */
  private readonly logger = new Logger(AdminModule.name);

  /**
   * [ process.env — 환경 변수 ]
   * .env 파일에 정의된 값을 읽음. 코드에 비밀번호를 직접 쓰지 않기 위함.
   *
   * .env 파일 예시:
   *   DEFAULT_ADMIN_USERNAME=admin@example.com
   *   DEFAULT_ADMIN_PASSWORD=SecurePass123!
   *
   * || '' → 환경 변수가 없으면 빈 문자열을 기본값으로 사용.
   */
  private readonly defaultAdminEmail = process.env.DEFAULT_ADMIN_USERNAME || '';
  private readonly defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || '';

  /**
   * [ 의존성 주입 (Dependency Injection) ]
   * 1. 개념: 클래스가 필요한 도구(객체)를 스스로 만들지 않고, 외부(NestJS)로부터 주입받는 것.
   * 2. 문법: constructor(private readonly 변수명: 클래스타입) {}
   * 3. 작동 원리:
   *    - @Injectable()이 붙은 클래스(PrismaService 등)를 NestJS가 미리 생성(메모리에 로드).
   *    - 이 도구가 필요한 다른 클래스(AdminModule 등)의 생성자(constructor)에 넣어줌.
   * 4. 장점:
   *    - 객체를 매번 새로 생성(new)하지 않아 메모리 절약 (싱글톤 패턴).
   *    - 클래스 간의 결합도가 낮아져서 코드 수정이나 테스트가 쉬워짐.
   */
  constructor(private readonly prisma: PrismaService) { }

  /**
   * [ 시딩(Seeding) — 서버 시작 시 필수 데이터 자동 생성 ]
   *
   * 이 함수는 서버가 시작될 때 NestJS가 자동으로 호출함 (OnModuleInit).
   * 최고관리자 계정이 없으면 자동으로 생성해줌.
   *
   * 흐름:
   * 1. 환경 변수 확인 → 없으면 경고 후 중단
   * 2. 해당 이메일로 관리자 조회
   * 3. 이미 존재하면 → 로그만 남기고 종료
   * 4. 없으면 → 새로 생성 (비밀번호는 해시 처리)
   */
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

      /**
       * [ hashSync(비밀번호, 라운드수) ]
       * 평문 비밀번호를 해시(암호화)로 변환.
       * 10 = 솔트 라운드 수 (높을수록 보안↑ 속도↓).
       * 결과: "password123" → "$2a$10$xK3v..." (복원 불가능)
       *
       * [ AdminRole.최고관리자 ]
       * Prisma가 admin.prisma의 enum AdminRole을 TypeScript enum으로 자동 생성.
       * 문자열 '최고관리자' 대신 enum을 사용하면 오타 방지 + 자동완성 지원.
       */
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
