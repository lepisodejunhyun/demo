/**
 * ============================================================
 * [ PrismaModule이란? ]
 * 1. 개념: PrismaService를 NestJS의 모듈 시스템에 등록하는 "포장지" 모듈.
 *
 * 2. 모듈로 감싸는 이유:
 *    - NestJS는 모든 서비스를 "모듈 단위"로 관리하기 때문.
 *    - "어떤 모듈이 어떤 서비스를 제공하는지"를 한 곳에 선언해야 DI 컨테이너가 추적 가능.
 *
 * 3. 이 모듈의 특별한 점: @Global()이 붙어있음.
 *    → 한 번만 AppModule에 import해두면, 다른 모든 모듈에서
 *      PrismaService를 import 없이 바로 주입받아 쓸 수 있음.
 *
 * [ @Global()이 없다면? ]
 *   AdminModule, FaqModule, NoticeModule 등 PrismaService를 쓰는 모든 모듈마다
 *   imports: [PrismaModule]를 일일이 적어야 함.
 *   → DB는 거의 모든 도메인에서 쓰이므로 매우 번거로움 + 누락하면 에러.
 *
 * [ @Global() 붙이면 ]
 *   AppModule에 PrismaModule을 한 번만 등록 → 어디서나 PrismaService 사용 가능.
 *   admin.module.ts 주석에 적었던 "PrismaModule은 @Global이라 자동 제공됨"의 정체.
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. NestJS 모듈 시스템의 기본 구조
 * 2. @Global() — 전역 모듈 데코레이터
 * 3. providers — 이 모듈이 만들고 관리하는 서비스 목록
 * 4. exports — 다른 모듈에서 사용할 수 있도록 외부에 공개하는 서비스 목록
 * 5. providers vs exports의 차이
 * 6. 싱글톤(Singleton) 패턴 — DI 컨테이너가 자동으로 적용
 * ============================================================
 */

import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

/**
 * ============================================================
 * [ @Global() — 전역 모듈로 만들기 ]
 *
 * 1. 개념: "이 모듈을 한 번 import하면 어디서나 그 exports를 쓸 수 있게 해줘"
 *          라는 NestJS 전용 선언.
 *
 * 2. 비유: 공기. 처음에 산소를 한 번 정의해두면, 모든 사람이 따로 신청 없이
 *          숨 쉴 수 있는 것과 비슷.
 *
 * 3. 작동 원리:
 *    - 일반 모듈은 "이 모듈을 imports에 등록한 모듈에서만" 서비스 접근 가능.
 *    - @Global()이 붙은 모듈은 NestJS의 DI 컨테이너에 전역으로 등록되어
 *      어떤 모듈에서든 주입 가능.
 *
 * 4. 남용 금지:
 *    모든 모듈을 @Global()로 만들면 의존 관계가 보이지 않아 코드 추적이 어려워짐.
 *    "정말 거의 모든 곳에서 쓰는 것"(DB, 설정, 로거 등)에만 사용 권장.
 *
 * 5. 데코레이터 스택:
 *    @Global() + @Module({...})을 함께 쓰는 게 일반적인 패턴.
 *    @Global()이 위에, @Module이 아래에 위치하며 둘 다 같은 클래스에 적용됨.
 *
 * ============================================================
 * [ @Module 옵션 — providers vs exports ]
 *
 * 1. providers: [PrismaService]
 *    - 의미: "이 모듈이 PrismaService 인스턴스를 만들어 관리한다"는 선언.
 *    - 효과: NestJS가 이 클래스의 인스턴스를 1개 만들어 모듈 내부에 둠.
 *    - 한 모듈에 여러 개 등록 가능: providers: [ServiceA, ServiceB, ...]
 *
 * 2. exports: [PrismaService]
 *    - 의미: "다른 모듈에서도 이 서비스를 쓸 수 있게 외부로 공개"한다는 선언.
 *    - 효과: providers에만 있고 exports에 없으면 모듈 내부에서만 사용 가능.
 *
 * 3. 비유: providers = "주방에서 만든 음식", exports = "손님에게 내놓는 음식".
 *          만들기만 하고 내놓지 않으면(=exports 누락) 다른 곳에서 못 먹음.
 *
 * 4. PrismaService가 양쪽 다 등장하는 이유:
 *    - providers에 등록 → 이 모듈이 만들고 관리.
 *    - exports에 등록   → 외부 모듈(admin, faq, notice 등)에서도 주입 가능.
 *
 * ============================================================
 * [ 싱글톤(Singleton) — DI가 자동으로 적용해주는 패턴 ]
 *
 * 1. 개념: 한 클래스의 인스턴스가 앱 전체에서 단 1개만 존재하는 패턴.
 *
 * 2. NestJS DI의 기본 동작:
 *    - providers에 등록된 서비스는 NestJS가 자동으로 싱글톤으로 관리.
 *    - 어디서 주입받든 같은 인스턴스를 받음.
 *    - 즉, AdminService에서 받은 prisma와 NoticeService에서 받은 prisma는 동일 객체.
 *
 * 3. 왜 싱글톤이 좋은가?
 *    - DB 커넥션 풀처럼 무거운 리소스를 한 번만 초기화 → 메모리/성능 절약.
 *    - 상태를 공유해야 할 때 안전 (모두 같은 객체 보기).
 *
 * 4. 예외:
 *    - @Injectable({ scope: Scope.REQUEST })를 붙이면 요청마다 새 인스턴스 생성 가능.
 *    - 하지만 99%의 경우 기본 싱글톤이 정답.
 * ============================================================
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})

export class PrismaModule {}
