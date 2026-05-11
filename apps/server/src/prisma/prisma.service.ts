/**
 * ============================================================
 * [ PrismaService란? ]
 * 1. 개념: Prisma(ORM)를 NestJS에서 사용할 수 있도록 감싼 서비스 클래스.
 *
 * 2. ORM(Object-Relational Mapping)이란?
 *    - "SQL을 직접 쓰지 않고, 메서드로 DB를 다루게 해주는 도구."
 *    - 예: SELECT * FROM "Admin" WHERE deletedAt IS NULL  ← SQL
 *          this.prisma.admin.findMany({...})              ← Prisma 메서드
 *    - 장점: 타입 안전 + SQL 인젝션 자동 방어 + DB 종류 바꿔도 코드 그대로.
 *
 * 3. 왜 PrismaClient를 그대로 안 쓰고 따로 감싸는가?
 *    a) NestJS의 생명주기 훅(onModuleInit 등)에 맞춰 DB 연결/해제를 제어하려고.
 *    b) @Injectable()로 만들어 다른 서비스에 의존성 주입(DI)으로 넣어주기 위해.
 *    c) 한 곳에서 PrismaClient 설정을 관리 → 어댑터/로깅/미들웨어 통합 용이.
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. 상속(extends) — 부모 클래스의 모든 기능을 물려받기
 * 2. 인터페이스 구현(implements) — "이 메서드를 가질 것"이라는 약속 (faq-detail.page.ts 참고)
 * 3. super() — 부모 클래스 생성자 호출
 * 4. NestJS 생명주기 훅(OnModuleInit) — Angular의 OnInit과 같은 패턴
 * 5. process.env — Node.js의 환경 변수 읽기
 * 6. Non-null assertion (!) — TypeScript 단언 연산자
 * 7. 어댑터 패턴(Adapter Pattern) — PrismaPg로 드라이버 교체 가능
 * ============================================================
 */

import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * [ @Injectable() — 주입 가능한 서비스 등록 ]
 * 1. 효과: NestJS의 DI 컨테이너가 이 클래스를 관리할 수 있게 등록.
 * 2. 결과: 다른 서비스/모듈에서 constructor(private prisma: PrismaService)로 주입받음.
 *          (admin.service, notice.service에서 그렇게 사용 중)
 * 3. 빠뜨리면? → 주입 시 NestJS가 "이 클래스를 못 찾겠다"는 에러 발생.
 *
 * ============================================================
 * [ extends PrismaClient — 상속(Inheritance) ]
 * 1. 개념: 부모 클래스의 모든 필드/메서드를 자식 클래스가 그대로 물려받음.
 *
 * 2. 비유: 가업 승계. 아버지가 운영하던 식당의 메뉴, 설비, 노하우를
 *          아들이 그대로 물려받고, 자신만의 신메뉴를 추가.
 *
 * 3. 효과:
 *    - PrismaClient가 가진 모든 모델 메서드(this.admin.findMany 등)를
 *      PrismaService도 그대로 사용 가능.
 *    - 위에 NestJS의 @Injectable / OnModuleInit 기능을 "얹어서" 확장.
 *
 * 4. extends vs implements 차이:
 *    - extends    → 부모의 실제 구현(코드)을 물려받음. 하나만 가능.
 *    - implements → 인터페이스의 모양만 지키겠다는 약속. 여러 개 가능.
 *    - 이 클래스는 extends PrismaClient + implements OnModuleInit
 *      → "PrismaClient의 기능을 물려받고, OnModuleInit의 약속도 지킨다"
 *
 * [ implements OnModuleInit — 생명주기 훅 약속 ]
 * 1. NestJS 생명주기 훅 가족 (Angular의 OnInit과 같은 컨셉):
 *    | 인터페이스               | 메서드                | 호출 시점                    |
 *    |-------------------------|----------------------|----------------------------|
 *    | OnModuleInit            | onModuleInit         | 모듈 초기화 직후             |
 *    | OnApplicationBootstrap  | onApplicationBootstrap | 모든 모듈 초기화 후         |
 *    | OnModuleDestroy         | onModuleDestroy      | 모듈이 종료되기 직전          |
 *    | OnApplicationShutdown   | onApplicationShutdown| 앱 전체 종료 시              |
 *
 * 2. 명명 규칙: 인터페이스 OnXxx, 메서드 onXxx (Angular와 동일한 패턴).
 *    → 메서드 이름을 onModuleInit 정확히 그대로 적어야 NestJS가 호출함.
 *
 * 3. 왜 constructor가 아니라 onModuleInit에서 DB 연결?
 *    - constructor: 클래스 인스턴스 만드는 "그 순간". 의존성이 아직 준비 안 됐을 수 있음.
 *    - onModuleInit: 모든 의존성 주입이 완료된 후 호출. DB 연결 같은 무거운 작업에 적합.
 * ============================================================
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  /**
   * ============================================================
   * [ constructor — Prisma 초기화 ]
   *
   * 1. PrismaPg: PostgreSQL용 어댑터(드라이버 연결 도구).
   *    - 어댑터 패턴(Adapter Pattern): PrismaClient는 다양한 DB를 지원하려고
   *      "어떤 DB든 같은 인터페이스로 다루기" 위한 어댑터를 받는 구조.
   *    - 어댑터를 PrismaSqlite로 바꾸면 같은 코드가 SQLite에서 동작.
   *
   * 2. connectionString — DB 접속 문자열.
   *    형식: postgresql://[유저]:[비번]@[호스트]:[포트]/[DB이름]
   *    예: postgresql://admin:secret@localhost:5432/myapp
   *
   * 3. process.env.DATABASE_URL의 정체:
   *    - process는 Node.js 전역 객체. 현재 프로세스 정보를 담음.
   *    - process.env는 환경 변수 모음 객체.
   *    - .env 파일의 값들이 'dotenv/config' (main.ts 최상단 import)에 의해 여기로 로드됨.
   *
   * 4. Non-null assertion (!) 연산자:
   *    - 문법: 변수! 형태로 사용.
   *    - 의미: "이 값은 절대 undefined/null이 아니다"라고 TypeScript에게 단언.
   *    - 효과: 컴파일러의 "혹시 null일 수도 있는데?" 경고를 무시.
   *    - 위험: 만약 실제로 undefined면 런타임 크래시 → .env에 반드시 정의되어야 함.
   *    - 대안: 더 안전하게 하려면 if (!process.env.DATABASE_URL) throw ... 같은 방어 코드.
   *
   * ============================================================
   * [ super({ adapter }) — 부모 생성자 호출 ]
   *
   * 1. 개념: 자식 클래스 생성자 안에서 부모 클래스 생성자를 호출하는 키워드.
   *
   * 2. 비유: 가업 승계 시 "아버지가 식당 차릴 때 했던 등록 절차"를 자식도
   *          먼저 똑같이 거쳐야 함. 그 등록 절차를 호출하는 게 super().
   *
   * 3. 왜 필요한가?
   *    - 부모 클래스(PrismaClient)도 내부에 초기화 로직이 있음.
   *    - super()를 호출하지 않으면 부모의 초기화가 안 되어 this를 사용할 수 없음.
   *    - 즉, "부모를 먼저 깨우고 나서 내 일을 해야 한다"는 순서.
   *
   * 4. 인자 전달:
   *    - super(인자) → 부모 생성자에 인자를 그대로 넘김.
   *    - 여기서는 PrismaClient의 생성자가 { adapter: ... } 옵션을 받게 되어
   *      PostgreSQL 어댑터를 사용해 DB와 통신하게 됨.
   *
   * 5. 규칙: 자식 클래스에 constructor가 있으면, this를 쓰기 전에 반드시 super() 호출.
   *          깜빡하면 TypeScript가 컴파일 에러로 잡아냄.
   * ============================================================
   */
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    super({ adapter })
  }

  /**
   * ============================================================
   * [ onModuleInit — 서버 시작 시 DB 연결 ]
   *
   * 1. 호출 시점: NestJS가 이 모듈을 초기화하는 단계에서 자동으로 한 번 호출.
   *
   * 2. $connect()의 정체:
   *    - PrismaClient(부모 클래스)가 제공하는 메서드.
   *    - 이름 앞의 $ → "Prisma 내부 시스템 메서드"를 표시하는 관례.
   *      ($connect, $disconnect, $transaction 등은 모델이 아닌 시스템용)
   *    - 효과: DB와 실제 커넥션 풀(connection pool)을 맺음.
   *
   * 3. Prisma의 lazy 연결 동작:
   *    사실 Prisma는 첫 쿼리 실행 시 자동으로 연결됨. 그럼 왜 미리 호출?
   *    - 서버 부팅 단계에서 DB 연결 실패를 즉시 감지할 수 있음.
   *      (잘못된 비번/호스트 등이 있으면 부팅 자체가 실패 → 빠른 피드백)
   *    - 첫 요청이 들어왔을 때 연결 지연 없이 즉시 응답 가능.
   *
   * 4. 종료 시 정리:
   *    - 더 깔끔하게 하려면 OnModuleDestroy도 implements하고
   *      onModuleDestroy() { await this.$disconnect(); } 추가 가능.
   *    - Prisma 5+ 부터는 NestJS의 종료 훅과 잘 통합되어 필수는 아님.
   *
   * 5. async 키워드의 의미 (faq-detail.page.ts 참고):
   *    - $connect()가 Promise를 반환하므로 await 사용 필요.
   *    - await를 쓰려면 함수에 async가 붙어 있어야 함.
   * ============================================================
   */
  async onModuleInit() {
    await this.$connect();
  }
}
