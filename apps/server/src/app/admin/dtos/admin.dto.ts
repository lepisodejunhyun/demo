/**
 * ============================================================
 * [ Response DTO란? ]
 * 1. 개념: 서버가 클라이언트에게 "응답으로 내보낼" 데이터의 형태를 정의하는 클래스.
 *
 * 2. 왜 필요한가?
 *    - DB에서 가져온 원본(Prisma의 Admin 타입)을 그대로 내보내면 password, deletedAt 등
 *      클라이언트가 알면 안 되는 필드까지 노출됨.
 *    - DTO를 거치면 "어떤 필드를 응답에 포함할지" 명시적으로 통제 가능.
 *
 * 3. 흐름:
 *    DB → Prisma Admin 객체 → plainToInstance(AdminDTO, admin) → 클라이언트
 *                              ↑ 여기서 DTO 규칙에 따라 필드 필터링
 *
 * 4. Request DTO와의 차이 (admin-sign-in.dto.ts와 비교):
 *    - Request DTO  → 클라이언트 → 서버 방향. 입력 검증이 핵심.
 *    - Response DTO → 서버 → 클라이언트 방향. 직렬화(노출 필드 통제)가 핵심.
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. 데코레이터(@)란?         — 클래스/필드에 부가 정보를 다는 문법
 * 2. class-transformer 라이브러리 — 평범한 객체 ↔ 클래스 인스턴스 변환
 * 3. @Exclude() (클래스 레벨)  — "기본은 다 빼기"
 * 4. @Expose()  (필드 레벨)    — "이것만 응답에 포함"
 * 5. 화이트리스트 vs 블랙리스트 방식
 * 6. @ApiProperty             — Swagger 문서에 필드 설명 표시
 * 7. enum 옵션                — Swagger에서 허용 값 명시
 * 8. required / nullable      — null 허용 여부 표시
 * 9. Soft Delete 패턴         — deletedAt 필드의 역할
 *
 * [ admin.controller.ts와의 연결 고리 ]
 * admin.controller에서 `plainToInstance(AdminDTO, admins)`를 호출하면
 * 여기 정의된 @Exclude / @Expose 규칙이 적용되어 password 같은 필드가 자동 제거됨.
 * ============================================================
 */

import { ApiProperty } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { Exclude, Expose } from "class-transformer";


/**
 * ============================================================
 * [ 데코레이터(Decorator) — '@' 기호란? ]
 * 1. 개념: 클래스/메서드/속성/매개변수에 "부가 정보(메타데이터)"를 붙이는 문법.
 *          내부적으로는 그냥 "특별한 인자를 받는 함수"임.
 *
 * 2. 비유: 옷에 다는 라벨. 라벨이 옷의 본체를 바꾸진 않지만,
 *          "이 옷은 면 100%다", "드라이클리닝만 가능하다" 같은 정보를 전달함.
 *          그 라벨을 보고 세탁기/세탁소(라이브러리)가 다르게 처리함.
 *
 * 3. 작동 원리:
 *    a) 컴파일 시: TypeScript가 reflect-metadata 라이브러리와 함께
 *       클래스/필드에 데코레이터 정보를 "메타데이터"로 저장.
 *    b) 런타임 시: NestJS / class-transformer 같은 라이브러리가
 *       그 메타데이터를 읽어서 동작을 결정.
 *
 * 4. 예: @Exclude()는 그 자체로는 아무것도 안 하지만, plainToInstance()가
 *        "이 필드에 @Exclude가 붙었나?" 확인하고 결과에서 제외함.
 *
 * [ class-transformer 라이브러리란? ]
 * 1. 역할: "평범한 객체(plain object) ↔ 클래스 인스턴스" 변환 + 직렬화 처리.
 * 2. 핵심 함수: plainToInstance(클래스, 객체)
 *    - 입력: { id: '...', email: '...', password: '...', deletedAt: null }
 *    - 출력: AdminDTO 인스턴스 (단, @Exclude된 필드는 제거됨)
 * 3. 왜 이게 필요한가?
 *    - JSON.stringify는 모든 필드를 그대로 직렬화함 → 민감 정보 노출 위험.
 *    - class-transformer는 데코레이터를 보고 똑똑하게 거름.
 * ============================================================
 *
 * [ @Exclude() — 클래스 레벨 적용 ]
 * 1. 위치: class 키워드 바로 위.
 * 2. 효과: "이 클래스의 모든 필드를 기본적으로 응답에서 제외해줘"라는 선언.
 *          그 다음, 필드마다 @Expose()를 붙인 것만 응답에 포함됨.
 *
 * 3. 화이트리스트(Whitelist) 방식의 의미:
 *    이 패턴의 장점: 새로운 필드가 DB에 추가되어도(예: phoneNumber, ssn)
 *                  @Expose()를 명시적으로 붙이지 않는 한 절대 응답에 나가지 않음.
 *                  → "실수로 민감 정보가 노출되는 사고"를 구조적으로 방지.
 *
 * 4. 반대 패턴인 블랙리스트(Blacklist):
 *    @Exclude를 password 필드에만 붙이는 방식.
 *    단점: 새 민감 필드가 추가될 때마다 @Exclude를 빠뜨리지 않도록 신경 써야 함.
 *          사람의 주의력에 의존하는 구조 → 사고 나기 쉬움.
 *
 * 5. 예시 — DB의 Admin 모델에는 password 필드가 있지만 여기엔 정의 안 됨.
 *    → 어차피 @Exclude로 다 빠지므로 응답에 password가 절대 포함될 수 없음.
 *    → "정의 안 한 필드는 자동으로 안 나간다" = 가장 안전한 기본값.
 */
@Exclude()
export class AdminDTO {
  /**
   * [ @ApiProperty — Swagger 문서 자동 생성 ]
   * 1. 출처: @nestjs/swagger 라이브러리.
   * 2. 역할: Swagger UI(/reference)에서 이 필드 옆에 표시할 메타데이터를 등록.
   * 3. 검증과의 관계: 검증과는 별개. 순수 문서화 전용.
   *    (검증은 class-validator의 @IsString 등이 담당 — admin-sign-in.dto.ts 참고)
   * 4. 옵션:
   *    - description: 필드 설명 텍스트
   *    - enum:        가능한 값 목록 (드롭다운으로 표시)
   *    - required:    필수 여부
   *    - nullable:    null 허용 여부
   *    - example:     예시 값
   *
   * [ @Expose() — 필드 레벨 적용 ]
   * 1. 효과: 클래스 레벨 @Exclude()로 인해 모든 필드가 기본 제외 상태인데,
   *          @Expose()를 붙인 필드만 plainToInstance 결과에 살아남음.
   * 2. 핵심: "기본 차단 + 필요한 것만 허용" — 안전한 기본값 원칙.
   * 3. 추가 옵션 (참고):
   *    @Expose({ name: 'email_address' }) → 응답 JSON 키 이름을 다르게 줄 수도 있음.
   *    @Expose({ groups: ['admin'] })    → 특정 그룹에서만 노출되도록 제한 가능.
   */
  @ApiProperty({
    description: '관리자 고유 식별자',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: '이메일(로그인ID)',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: '관리자 이름',
  })
  @Expose()
  name: string;

  /**
   * [ enum 옵션 — Swagger에 허용 값 목록 명시 ]
   *
   * 1. AdminRole의 정체:
   *    Prisma 스키마(schema.prisma)에 정의된 enum AdminRole을
   *    Prisma가 TypeScript enum으로 자동 생성해준 것.
   *    예: enum AdminRole { 최고관리자, 일반관리자 }
   *
   * 2. enum: AdminRole 옵션을 넘기면 Swagger 문서에:
   *    - 드롭다운으로 가능한 값들이 표시됨.
   *    - API 사용자가 "role에 뭘 넣을 수 있지?"를 추측하지 않아도 됨.
   *
   * 3. 타입 안전성 보너스:
   *    role: AdminRole로 타입 지정 → 문자열 '최고관리자'를 직접 쓰는 대신
   *    AdminRole.최고관리자로 접근 → 오타 시 컴파일 에러.
   */
  @ApiProperty({
    description: '관리자 권한 등급',
    enum: AdminRole,
  })
  @Expose()
  role: AdminRole;

  @ApiProperty({
    description: '연속 로그인 실패 횟수',
  })
  @Expose()
  failCount: number;

  @ApiProperty({
    description: '관리자 계정 잠김 시간',
  })
  @Expose()
  lockedUntil: Date | null;

  /**
   * [ required / nullable 옵션 — null 허용 표시 ]
   *
   * 1. required: false
   *    - "이 필드가 응답에 없을 수도 있다"고 Swagger에 알림.
   *    - 클라이언트 코드가 자동 생성될 때 이 필드를 optional(?)로 만듦.
   *
   * 2. nullable: true
   *    - "값이 null일 수도 있다"고 명시.
   *    - undefined와 null을 구분해야 할 때 의미가 큼.
   *
   * 3. TypeScript 타입과의 일치:
   *    `lastLoginAt: Date | null` ← 코드 타입도 같이 맞춰야 Swagger 문서와 일관됨.
   *
   * 4. 예: 한 번도 로그인 안 한 신규 관리자는 lastLoginAt이 null.
   *        → required: false + nullable: true로 그 가능성을 표현.
   */
  @ApiProperty({
    description: '관리자 계정 마지막 로그인 시간',
    required: false,
    nullable: true
  })
  @Expose()
  lastLoginAt: Date | null;

  @ApiProperty({
    description: '관리자 계정 생성 시간',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: '관리자 계정 수정 시간',
  })
  @Expose()
  updatedAt: Date;

  /**
   * ============================================================
   * [ Soft Delete란? ]
   * 1. 개념: 데이터를 "실제로 DELETE 하지 않고", 삭제됐다는 표시만 남기는 패턴.
   *          이 코드에서는 deletedAt 컬럼에 삭제 시각을 기록 → null이면 활성, 값 있으면 삭제됨.
   *
   * 2. 왜 쓰는가?
   *    - 실수 복구 가능 (deletedAt = null로 되돌리면 부활).
   *    - 감사(audit) 추적 — "언제 누가 삭제했는가" 기록 보존.
   *    - 외래 키 관계 유지 — 다른 테이블이 참조해도 깨지지 않음.
   *
   * 3. 단점:
   *    - 모든 조회 쿼리에 `where: { deletedAt: null }`을 빼먹지 말아야 함.
   *      (admin.service / faq.service / notice.service의 findMany/findFirst 참고)
   *    - DB가 점점 무거워짐 → 주기적으로 진짜 삭제하는 정책 필요할 수 있음.
   *
   * 4. 응답 DTO에 deletedAt이 노출되는 이유?
   *    관리자 화면에서 "삭제된 데이터 목록" 같은 기능을 만들 때 필요.
   *    일반 사용자용 API에서는 보통 이 필드를 빼는 게 안전 (별도 DTO 사용).
   * ============================================================
   */
  @ApiProperty({
    description: '관리자 계정 삭제 시간',
    required: false,
    nullable: true
  })
  @Expose()
  deletedAt: Date | null;
}
