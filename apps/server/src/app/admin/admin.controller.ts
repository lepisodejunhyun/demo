/**
 * ============================================================
 * [ NestJS Controller란? ]
 * 클라이언트(브라우저, 앱)의 HTTP 요청을 받는 "입구" 역할.
 *
 * 흐름: 클라이언트 → Controller → Service → DB
 *       클라이언트 ← Controller ← Service ← DB
 *
 * Controller는 "어떤 URL에 어떤 요청이 오면 어떤 함수를 실행할지"만 정의하고,
 * 실제 비즈니스 로직(DB 조회, 검증 등)은 Service에 위임함.
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. @Controller()  — URL 경로 매핑
 * 2. @Get(), @Post() — HTTP 메서드 매핑
 * 3. @Body()         — 요청 본문 데이터 추출
 * 4. @ApiTags/Operation/OkResponse — Swagger 문서 자동 생성
 * 5. plainToInstance() — 응답 데이터 변환 (민감 정보 제거)
 * 6. DTO (Data Transfer Object) — 요청/응답 데이터 형태 정의
 * ============================================================
 */

import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from "./admin.service";
import { plainToInstance } from "class-transformer";
import { AdminDTO } from "./dtos/admin.dto";
import { AdminSignInDTO } from "./dtos/admin-sign-in.dto";

/**
 * @ApiTags('Admin')
 * → Swagger 문서에서 이 컨트롤러의 API들을 "Admin" 그룹으로 묶어 표시.
 *   http://localhost:3000/reference 에서 확인 가능.
 *
 * @Controller('admins')
 * → 이 클래스의 모든 API 경로 앞에 '/api/admins'가 자동으로 붙음.
 *   (main.ts의 setGlobalPrefix('api') + 여기서 지정한 'admins')
 *   예: @Get()          → GET  /api/admins
 *       @Post('signin') → POST /api/admins/signin
 */
@ApiTags('Admin')
@Controller('admins')
export class AdminController {
  /**
   * [ 생성자 의존성 주입 (Constructor Injection) ]
   * AdminService를 직접 new AdminService()로 만들지 않고,
   * NestJS가 자동으로 만들어서 넣어줌 (의존성 주입).
   *
   * private:  이 클래스 안에서만 접근 가능
   * readonly: 한번 할당되면 변경 불가 (실수 방지)
   */
  constructor(private readonly adminService: AdminService) { };

  @Get('hello')
  @ApiOperation({ summary: '인사말' })
  gethello() {
    return this.adminService.getHello();
  }

  /**
   * @Get() — HTTP GET 요청 처리. 괄호가 비어있으면 @Controller 경로 그대로 사용.
   *   → GET /api/admins 요청이 오면 이 함수 실행.
   *
   * @ApiOperation  — Swagger에 표시할 API 설명.
   *   summary:     한 줄 요약 (목록에서 보임)
   *   description: 상세 설명 (펼치면 보임)
   *
   * @ApiOkResponse — 성공(HTTP 200) 응답 형태를 Swagger에 알려줌.
   *   type: AdminDTO   → 응답 데이터의 타입
   *   isArray: true    → 배열([])로 반환됨을 명시
   *
   * async/await — DB 조회(비동기 작업)를 기다려야 하므로 async 사용.
   * Promise<AdminDTO[]> — "AdminDTO 배열을 담은 Promise" 반환 타입.
   */
  @Get()
  @ApiOperation({
    summary: '관리자 전체 조회',
    description: '모든 관리자를 조회합니다.',
  })
  @ApiOkResponse({
    description: '관리자 목록 조회 성공',
    type: AdminDTO,
    isArray: true,
  })
  async findAll(): Promise<AdminDTO[]> {
    const admins = await this.adminService.findAll();

    /**
     * [ plainToInstance(AdminDTO, admins) ]
     * DB에서 가져온 원본 데이터를 AdminDTO 클래스 인스턴스로 변환.
     *
     * 왜 필요한가?
     * → AdminDTO에서 @Exclude()로 표시한 필드(예: password)가 응답에서 자동 제거됨.
     * → 클라이언트에 비밀번호 같은 민감 정보가 절대 노출되지 않도록 보장.
     *
     * 원리: plain(일반 객체) → instance(클래스 인스턴스)로 변환하면서
     *       @Expose()/@Exclude() 데코레이터가 적용됨.
     */
    return plainToInstance(AdminDTO, admins);

  }

  /**
   * @Post('signin') — HTTP POST 요청 처리. POST는 "데이터를 보내서 무언가를 하는" 요청.
   *   'signin'이 경로에 추가 → POST /api/admins/signin
   *
   * @Body() — 클라이언트가 보낸 요청 본문(body)을 추출하는 데코레이터.
   *   예: 클라이언트가 { "email": "admin@test.com", "password": "1234" }를 보내면
   *       data 변수에 그 객체가 담김.
   *   AdminSignInDTO 타입이 지정되어 있으므로,
   *   main.ts의 ValidationPipe가 자동으로 형식 검증.
   *   (이메일 형식이 아니거나 필수값 없으면 자동 400 에러 반환)
   */
  @Post('signin')
  @ApiOperation({
    summary: '관리자 로그인',
    description: '관리자를 로그인합니다.',
  })
  @ApiOkResponse({
    description: '로그인 성공',
    type: AdminDTO,
  })
  async signin(@Body() data: AdminSignInDTO): Promise<AdminDTO> {
    const admin = await this.adminService.signIn(data);

    return plainToInstance(AdminDTO, admin);

  }

}
