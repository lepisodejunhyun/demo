/**
 * ============================================================
 * [ NestJS Service란? ]
 * 실제 비즈니스 로직(데이터 처리, 검증, 계산 등)을 수행하는 곳.
 * Controller가 "요청을 받는 입구"라면, Service는 "실제 일을 하는 곳".
 *
 * 흐름: Controller → Service → DB(Prisma)
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. @Injectable()        — NestJS에 "주입 가능한 서비스"로 등록
 * 2. PrismaService        — DB에 접근하는 ORM 도구 (SQL 없이 메서드로 DB 조작)
 * 3. findMany / findFirst — Prisma의 데이터 조회 메서드
 * 4. compareSync          — 비밀번호 해시 비교 (bcryptjs)
 * 5. UnauthorizedException — HTTP 401 에러 발생 도구
 * 6. EventEmitter2        — 이벤트 기반 아키텍처 (느슨한 결합)
 * ============================================================
 */

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Admin } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminSignInDTO } from "./dtos/admin-sign-in.dto";
import { compareSync } from "bcryptjs";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AdminEvents } from "./admin.const";


/**
 * @Injectable()
 * → "이 클래스는 다른 곳에서 주입(inject)받아 사용할 수 있다"고 NestJS에 알림.
 * → 이 데코레이터 없으면 NestJS가 이 클래스를 관리하지 않아 주입 불가능.
 * → Module의 providers 배열에도 등록해야 실제 사용 가능 (admin.module.ts 참고).
 */
@Injectable()
export class AdminService {
  /**
   * [ 생성자 의존성 주입 ]
   *
   * prisma: PrismaService
   * → DB 접근 도구. this.prisma.admin.findMany() 처럼
   *   "admin 테이블에서 여러 개를 찾아줘"라고 요청 가능.
   *
   * eventEmitter: EventEmitter2
   * → "이런 일이 발생했어!"라고 알림(이벤트)을 보내는 도구.
   *   Service는 "로그인 검증"만 담당하고,
   *   로그 기록 같은 부가 작업은 Listener에서 처리 (역할 분리).
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * @name findAll
   * @description 관리자 전체 조회
   * @returns {Promise<Admin[]>}
   */
  async findAll(): Promise<Admin[]> {
    /**
     * [ Prisma 조회 메서드 ]
     *
     * this.prisma   → PrismaService 인스턴스 (DB 연결 도구)
     * .admin        → admin.prisma에 정의한 Admin 모델(테이블)에 접근
     * .findMany({}) → 조건에 맞는 모든 행을 배열로 반환. {} = 전체 조회.
     *
     * SQL 변환: SELECT * FROM "Admin"
     *
     * 참고 — 다른 Prisma 조회 메서드:
     * - findFirst()  → 조건에 맞는 첫 번째 행 1개 (없으면 null)
     * - findUnique() → @unique 또는 @id 필드로 정확히 1개 조회
     * - findMany()   → 조건에 맞는 모든 행을 배열로 반환
     * - count()      → 조건에 맞는 행의 개수만 반환
     */
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
    /**
     * [ 구조 분해 할당 (Destructuring) ]
     * data 객체에서 email, password를 꺼내 각각 변수로 만듦.
     * 아래와 동일: const email = data.email; const password = data.password;
     */
    const { email, password } = data;

    /**
     * [ findFirst — 조건부 단일 조회 ]
     * where: 검색 조건 객체
     *   email: email     → 이메일이 일치하는 행
     *   deletedAt: null  → Soft Delete되지 않은(활성) 행만
     *
     * SQL 변환: SELECT * FROM "Admin"
     *          WHERE email = '값' AND "deletedAt" IS NULL LIMIT 1
     */
    const admin = await this.prisma.admin.findFirst({
      where: {
        email: email,
        deletedAt: null,
      },
    });

    /**
     * [ 예외 처리 — UnauthorizedException ]
     * HTTP 401(Unauthorized) 에러를 던짐.
     * throw: 함수 실행을 즉시 중단하고 에러 발생.
     * NestJS가 이걸 잡아서 { statusCode: 401, message: '...' } 응답을 보냄.
     *
     * 보안 팁: "이메일 없음" / "비밀번호 틀림"을 구분하지 않는 이유?
     * → 구분하면 공격자가 "이 이메일은 존재한다"는 정보를 알게 됨.
     */
    if (!admin) {
      throw new UnauthorizedException({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    /**
     * [ 비밀번호 검증 — compareSync ]
     * compareSync(평문, 해시) → true/false
     *
     * DB에는 비밀번호가 해시(암호화)되어 저장됨.
     * 예: "password123" → "$2a$10$xK3v..." (복원 불가능한 단방향 해시)
     *
     * hashSync    = 평문 → 해시 (저장할 때)
     * compareSync = 평문 vs 해시 비교 (로그인할 때)
     */
    const isPasswordValid = compareSync(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    /**
     * [ 이벤트 발행 (Event Emission) ]
     * this.eventEmitter.emit(이벤트이름, 데이터)
     *
     * "관리자가 로그인했어!"라는 이벤트를 발행.
     * AdminListener가 이 이벤트를 수신해서 처리 (예: 마지막 로그인 시각 업데이트).
     *
     * 왜 직접 처리하지 않고 이벤트로 분리?
     * → Service는 "로그인 검증"만 담당. 로그 기록, 알림 등 부가 작업은
     *   Listener에서 처리하면 역할이 깔끔하게 분리됨 (단일 책임 원칙).
     */
    this.eventEmitter.emit(AdminEvents.ADMIN_LOGGED_IN, { admin })

    return admin;
  }

}
