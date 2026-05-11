/**
 * ============================================================
 * [ AppModule이란? ]
 * 1. 개념: NestJS 앱의 "최상위(루트) 모듈". 모든 기능 모듈들이 여기 모여 하나의 앱이 됨.
 *
 * 2. 비유: 콘센트 멀티탭.
 *    AdminModule, FaqModule, NoticeModule 같은 기능들이 각자의 "플러그"인데,
 *    AppModule이라는 "멀티탭"에 꽂혀야 비로소 앱 안에서 동작함.
 *
 * 3. 모듈 트리 구조:
 *    AppModule (루트)
 *      ├── PrismaModule       (@Global이라 한번만 import해두면 어디서나 사용 가능)
 *      ├── EventEmitterModule (이벤트 시스템 활성화)
 *      ├── AdminModule
 *      ├── FaqModule
 *      └── NoticeModule
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. @Module() 데코레이터 — 클래스를 NestJS 모듈로 표시
 * 2. imports     — 다른 모듈을 가져와 그 기능을 사용
 * 3. controllers — HTTP 요청 입구를 등록
 * 4. providers   — 서비스(비즈니스 로직)를 등록
 * 5. 정적 모듈 vs 동적 모듈 (.forRoot()의 의미)
 * 6. DI 컨테이너(Dependency Injection Container) — NestJS가 객체를 만들고 연결하는 구조
 *
 * [ DI 컨테이너란? ]
 * 1. 개념: 객체 생성과 의존성 연결을 자동으로 해주는 NestJS의 핵심 시스템.
 * 2. 동작:
 *    a) 부팅 시 NestJS가 모든 @Module을 분석하여 어떤 클래스가 어디에 등록됐는지 파악.
 *    b) 각 클래스의 constructor를 보고 "어떤 의존성이 필요한지" 파악.
 *    c) 필요한 의존성을 미리 만들어두고, 주입이 필요할 때 꽂아줌.
 *    d) 결과적으로 우리는 new 키워드를 거의 쓸 일이 없음. NestJS가 다 해줌.
 * 3. AppModule의 역할: DI 컨테이너에게 "이런 부품들이 있다"고 전체 카탈로그를 보여주는 것.
 * ============================================================
 */

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FaqModule } from './faq/faq.module';
import { NoticeModule } from './notice/notice.module';

/**
 * ============================================================
 * [ @Module 데코레이터 — 클래스를 모듈로 선언 ]
 *
 * 1. 효과: 평범한 클래스를 NestJS가 "모듈"로 인식하게 함.
 *          이 데코레이터 없으면 클래스를 imports에 넣어도 NestJS가 무시함.
 *
 * 2. 옵션 4가지:
 *    a) imports     — 다른 모듈 (그 모듈의 exports를 이 모듈에서 사용 가능)
 *    b) controllers — 이 모듈이 가진 HTTP 컨트롤러들
 *    c) providers   — 이 모듈이 가진 서비스/리스너 등 주입 가능한 클래스들
 *    d) exports     — 다른 모듈에 공개할 providers (다른 모듈이 이 모듈을 import 시 사용 가능)
 *
 * ============================================================
 * [ imports 배열 분석 — 각 항목의 의미 ]
 *
 * 1. PrismaModule
 *    - @Global() 모듈이므로 여기 한 번만 적어두면 모든 하위 모듈에서 PrismaService 사용 가능.
 *    - (prisma.module.ts의 @Global() 데코레이터 덕분)
 *    - 이 한 줄이 없으면 → admin.service의 prisma 주입이 실패.
 *
 * 2. AdminModule / FaqModule / NoticeModule
 *    - 각 도메인의 기능 모듈들.
 *    - 여기에 등록되어야 해당 Controller(/api/admins, /api/faqs, /api/notices)가 활성화됨.
 *    - 하나라도 빠지면 그 도메인의 API가 404로 응답.
 *
 * 3. EventEmitterModule.forRoot()
 *    → 아래의 "동적 모듈" 섹션 참고. 일반 import와 다름.
 *
 * ============================================================
 * [ 정적 모듈 vs 동적 모듈 ]
 *
 * 1. 정적(Static) 모듈:
 *    imports: [AdminModule]
 *    - 모듈 클래스를 그대로 넘김.
 *    - 모듈이 자체적으로 모든 설정을 알고 있을 때 사용.
 *    - AdminModule, FaqModule, NoticeModule, PrismaModule이 모두 이 방식.
 *
 * 2. 동적(Dynamic) 모듈:
 *    imports: [EventEmitterModule.forRoot()]
 *    - 모듈 클래스에 정적 메서드(.forRoot 등)를 호출한 결과를 넘김.
 *    - "이 모듈을 설정과 함께 등록"하는 동적 형태.
 *    - 같은 모듈을 여러 설정으로 사용하고 싶을 때 유용.
 *
 * 3. .forRoot()와 .forFeature()의 차이 (NestJS 관용):
 *    - forRoot()    → 앱 전체에서 한 번만 호출 (보통 AppModule에서). 전역 설정 적용.
 *      예: TypeOrmModule.forRoot({ host, port, ... })
 *    - forFeature() → 각 기능 모듈에서 추가 설정 필요할 때.
 *      예: TypeOrmModule.forFeature([User, Post]) — 이 모듈에서 사용할 엔티티 등록.
 *
 * 4. 이 코드에서 EventEmitterModule.forRoot()를 호출하는 이유:
 *    - EventEmitter2 인스턴스를 NestJS의 DI 컨테이너에 등록.
 *    - admin.service / admin.listener에서 주입받아 emit/수신할 수 있게 됨.
 *    - 만약 EventEmitterModule만 적고 .forRoot()를 안 부르면 → 등록 안 되어 주입 실패.
 *
 * ============================================================
 * [ controllers / providers — AppModule 자체의 컨트롤러/서비스 ]
 *
 * 1. controllers: [AppController]
 *    - AppController는 보통 "/ 또는 /health" 같은 앱 전체 공통 라우트를 담당.
 *    - 각 도메인은 자기 모듈의 controllers에 등록 (예: AdminController는 AdminModule에).
 *
 * 2. providers: [AppService]
 *    - 앱 전반에서 쓰는 공통 서비스.
 *    - 거의 비어있는 경우가 많음 (도메인별로 분리되므로).
 * ============================================================
 */
@Module({
  imports: [PrismaModule, AdminModule, EventEmitterModule.forRoot(), FaqModule, NoticeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
