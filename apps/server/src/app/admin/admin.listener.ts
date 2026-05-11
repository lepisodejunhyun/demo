/**
 * ============================================================
 * [ Listener란? ]
 * 1. 개념: Service가 발행(emit)한 이벤트를 "수신(listen)해서 처리"하는 클래스.
 *          이벤트 기반 아키텍처(Event-Driven Architecture)의 수신부.
 *
 * 2. 비유: 라디오 방송국 vs 청취자.
 *    - Service(방송국)는 "이런 일이 있었어!"라고 전파(emit)만 함.
 *    - Listener(청취자)는 자신이 관심 있는 채널(이벤트)을 듣고 처리.
 *    - 청취자는 여러 명일 수도 있고, 한 명도 없을 수도 있음.
 *    - 방송국은 청취자가 누군지 몰라도 됨.
 *
 * [ admin.service.ts와의 연결 ]
 *   admin.service: this.eventEmitter.emit(AdminEvents.ADMIN_LOGGED_IN, { admin })
 *                                          ↓ (이벤트 발행)
 *   admin.listener: @OnEvent(AdminEvents.ADMIN_LOGGED_IN)
 *                   async handleAdminLoggedInEvent(payload) {...}  ← 자동 호출
 *
 * [ 이벤트 기반 아키텍처의 3대 장점 ]
 *
 * 1. 단일 책임 원칙(SRP):
 *    Service는 "로그인 검증"만 책임지고,
 *    "로그 기록 / 마지막 로그인 시각 업데이트 / 알림 전송" 같은 부가 작업은
 *    Listener에서 처리 → 각자의 역할이 깔끔해짐.
 *
 * 2. 느슨한 결합(Loose Coupling):
 *    Service는 "내가 누군가에게 알렸다"만 알면 됨.
 *    누가 그 이벤트를 처리하는지 몰라도 됨.
 *    → 나중에 새 핸들러를 추가/제거할 때 Service 코드를 건드릴 필요 없음.
 *
 * 3. 확장성(Extensibility):
 *    같은 이벤트를 여러 Listener가 동시에 수신 가능.
 *    예: ADMIN_LOGGED_IN 이벤트가 발생하면
 *        - LogListener:         감사 로그 기록
 *        - SlackListener:       슬랙으로 알림
 *        - StatisticsListener:  통계 집계
 *    Service는 이 셋의 존재를 몰라도 됨.
 *
 * [ 디자인 패턴 — Pub/Sub(Publisher-Subscriber) ]
 * - Publisher: 이벤트를 발행하는 쪽 (admin.service)
 * - Subscriber: 이벤트를 구독하는 쪽 (admin.listener)
 * - Event Bus: 둘을 이어주는 중간 다리 (EventEmitter2)
 * - Observer 패턴과 사실상 같은 개념.
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. @OnEvent(이벤트명) — 특정 이벤트를 수신하는 핸들러 등록
 * 2. payload — 이벤트와 함께 전달되는 데이터
 * 3. EventEmitter2 — @nestjs/event-emitter의 핵심 클래스
 * 4. NestJS 생명주기 훅(OnModuleInit) — prisma.service.ts에서 다룬 패턴과 동일
 * 5. Logger — NestJS 내장 로그 도구
 * 6. 구조 분해 할당(Destructuring) — 객체에서 원하는 속성만 꺼내기
 * 7. 인라인 타입 명시 — { admin: Admin } 형태로 함수 매개변수 타입 직접 적기
 *
 * ⚠️ 등록 잊지 말 것:
 *   Listener는 반드시 해당 모듈의 providers에 등록해야 NestJS가 인스턴스를 만들고
 *   이벤트 핸들러를 활성화함. (admin.module.ts의 providers: [..., AdminListener])
 *   providers에서 빼면 → 데코레이터를 아무리 잘 달아도 동작 안 함.
 * ============================================================
 */

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { AdminEvents } from "./admin.const";
import { Admin } from "@prisma/client";

/**
 * [ @Injectable() — DI 등록 ]
 * prisma.service.ts 주석 참고. NestJS가 이 클래스를 관리하고 주입할 수 있게 함.
 *
 * [ implements OnModuleInit — 생명주기 훅 약속 ]
 * 이 인터페이스를 implements 하면 onModuleInit() 메서드를 반드시 구현해야 하고,
 * NestJS가 모듈 초기화 시점에 자동 호출함.
 * (자세한 설명은 prisma.service.ts 또는 faq-detail.page.ts의 OnInit 주석 참고)
 *
 * 여기서는 단순히 "Listener가 살아있다"는 로그를 찍어 디버깅을 돕는 용도로 활용.
 * → 서버 부팅 시 [AdminListener] 로그가 안 보이면 Listener 등록 실패라고 즉시 알 수 있음.
 */
@Injectable()
export class AdminListener implements OnModuleInit {
  /**
   * [ Logger — NestJS 내장 로그 도구 ]
   * 1. console.log 대신 사용. 레벨별 색상이 다름.
   *    Logger.log()   → 일반 정보 (초록)
   *    Logger.warn()  → 경고 (노랑)
   *    Logger.error() → 에러 (빨강)
   *
   * 2. AdminListener.name 의 정체:
   *    - 클래스 객체의 .name 속성은 그 클래스의 이름 문자열을 반환.
   *    - AdminListener.name === 'AdminListener'
   *    - 직접 문자열로 'AdminListener' 적어도 되지만, 클래스명을 바꿀 때
   *      .name을 쓰면 자동으로 따라 바뀌므로 더 안전.
   *
   * 3. 로그 결과 형태:
   *    [Nest] 12345 - 2026-05-12 10:00:00 [AdminListener] 메시지...
   *    → [AdminListener] 태그가 붙어 어느 클래스의 로그인지 한눈에 보임.
   *
   * 4. private readonly:
   *    - private: 클래스 내부에서만 사용.
   *    - readonly: 한번 할당되면 변경 불가 (재할당 방지).
   */
  private readonly logger = new Logger(AdminListener.name);

  /**
   * [ EventEmitter2 — 의존성 주입 ]
   *
   * 1. 무엇인가?
   *    - @nestjs/event-emitter 패키지가 제공하는 이벤트 버스 클래스.
   *    - Node.js의 기본 EventEmitter를 확장한 더 강력한 버전.
   *    - emit() / on() / once() / 와일드카드 지원 등.
   *
   * 2. 왜 주입받는가?
   *    이 Listener는 이벤트를 "수신"만 하므로 사실 EventEmitter2를 직접 쓸 일은 없음.
   *    여기서는 "확장 대비"로 주입해둠.
   *    예: 이 Listener가 받은 이벤트를 처리하다가 또 다른 이벤트를 emit하고 싶을 때.
   *
   * 3. 만약 정말 안 쓴다면?
   *    constructor에서 제거해도 무방. (현재 IDE가 "안 쓰임" 힌트를 줄 수 있음)
   */
  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * [ onModuleInit — 부팅 직후 한 번 호출 ]
   *
   * 1. 호출 시점: NestJS가 이 모듈을 초기화한 직후.
   * 2. 용도: Listener가 정상 등록됐는지 빠르게 확인.
   *    → 서버 부팅 로그에 이 메시지가 안 보이면
   *      "AdminListener가 providers에 빠졌나?" 즉시 의심 가능.
   * 3. async가 없는 이유: 안에서 await를 쓰지 않으므로 동기 함수로 충분.
   *    (필요하면 async onModuleInit() {}로 바꿔 비동기 작업 가능)
   */
  onModuleInit() {
    this.logger.log('AdminListener가 실행되었습니다.');
  }

  /**
   * ============================================================
   * [ @OnEvent(이벤트명) — 이벤트 수신 등록 ]
   *
   * 1. 개념: "이 이벤트가 발생하면 아래 함수를 자동 호출해줘"라는 등록.
   *
   * 2. 작동 원리:
   *    a) NestJS 부팅 시 EventEmitterModule이 모든 클래스의 메서드를 스캔.
   *    b) @OnEvent가 붙은 메서드를 찾으면 이벤트 버스에 핸들러로 등록.
   *    c) emit이 발생하면 등록된 모든 핸들러를 호출.
   *
   * 3. 이벤트명을 상수로 받는 이유:
   *    AdminEvents.ADMIN_LOGGED_IN 사용 → Magic String 회피.
   *    (admin.const.ts 참고)
   *
   * 4. 여러 이벤트 수신 가능:
   *    @OnEvent('admin.*')  ← 와일드카드 (admin.logged_in, admin.created 등 모두)
   *    @OnEvent(['a', 'b']) ← 여러 이벤트를 한 핸들러로
   *
   * 5. 옵션:
   *    @OnEvent('xxx', { async: true })  → 비동기 안전 모드
   *    @OnEvent('xxx', { priority: 1 })  → 처리 순서 지정
   *
   * ============================================================
   * [ payload 매개변수 ]
   *
   * 1. payload의 정체:
   *    - emit(이벤트명, 데이터)에서 두 번째 인자로 전달된 "데이터"가 그대로 들어옴.
   *    - admin.service에서 emit(..., { admin })으로 보냈으므로
   *      payload === { admin: Admin객체 }
   *
   * 2. 타입 명시 — payload: { admin: Admin }:
   *    - 인라인 타입 표현. 따로 interface를 만들지 않고 즉석에서 타입을 적음.
   *    - 장점: 작은 payload는 빠르게 작성 가능.
   *    - 단점: 같은 payload를 여러 곳에서 받는다면 interface로 빼서 재사용이 나음.
   *
   * 3. ⚠️ 타입 안정성의 한계:
   *    - @OnEvent는 emit의 데이터 모양을 자동 검증하지 못함.
   *    - emit 쪽이 { user: ... }를 보내도 여기서 { admin: ... }로 받으면
   *      런타임에 undefined가 됨. (실수 방지를 위해 emit/listener 모두 같은 타입을 적어야 함)
   *
   * ============================================================
   * [ 구조 분해 할당(Destructuring) ]
   *
   * 1. const { admin } = payload;
   *    - payload 객체에서 admin 속성만 꺼내 같은 이름의 변수에 담음.
   *    - 아래와 100% 동일:  const admin = payload.admin;
   *
   * 2. 왜 쓰는가?
   *    - 코드가 짧고 읽기 쉬워짐.
   *    - 여러 속성을 한 번에 꺼낼 때 더 빛남:
   *      const { admin, timestamp, ip } = payload;
   *
   * 3. 이름 바꾸기:
   *    const { admin: loggedInAdmin } = payload;
   *    → admin을 loggedInAdmin이라는 이름의 변수로 받음.
   *
   * ============================================================
   * 향후 확장 예시 (실무에서 자주 추가하는 처리들):
   *   - this.prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
   *   - this.slackService.send(`관리자 ${admin.email} 로그인`)
   *   - this.statisticsService.increment('admin_login')
   *   - this.auditLogService.record('LOGIN', admin.id)
   * ============================================================
   */
  @OnEvent(AdminEvents.ADMIN_LOGGED_IN)
  async handleAdminLoggedInEvent(payload: {admin: Admin}) {
    const {admin } = payload;
    this.logger.log(`관리자 로그인 이벤트 처리 완료: ${admin.email}`);
  }
}
