/**
 * ============================================================
 * [ 이벤트 상수 파일이란? ]
 * 1. 개념: 이벤트 이름(문자열)을 한 곳에 모아 상수로 정의해놓은 파일.
 *
 * 2. 왜 따로 빼는가? — Magic String 문제 회피:
 *
 *    [ Magic String이란? ]
 *    - 코드 안에 하드코딩된 문자열을 부르는 말.
 *    - 예: this.eventEmitter.emit('admin.logged_in', { admin })
 *           @OnEvent('admin.logged_in')
 *      → 같은 문자열을 두 곳에 직접 적은 상태 = Magic String.
 *
 *    [ Magic String의 3가지 문제 ]
 *    1. 오타 위험:
 *       emit('admin.loged_in')  ← 'g' 한 개 빠뜨림
 *       @OnEvent('admin.logged_in')
 *       → 컴파일러는 둘 다 그냥 문자열로 보므로 에러 없음.
 *       → 런타임에 이벤트가 연결되지 않는데도 조용히 통과 → 디버깅 지옥.
 *
 *    2. 자동완성 안 됨:
 *       IDE는 평범한 문자열에 대해 "어떤 이벤트가 존재하는지" 알려주지 못함.
 *       개발자가 일일이 기억하거나 다른 파일 뒤져야 함.
 *
 *    3. 이름 변경 비용 ↑:
 *       이벤트명을 'admin.signed_in'으로 바꾸려면 모든 사용처를 찾아 일일이 수정.
 *       하나라도 빠뜨리면 이벤트가 끊김.
 *
 * 3. 상수로 빼면 해결되는 것:
 *
 *    [ 사용 예 — 상수 방식 ]
 *    emit(AdminEvents.ADMIN_LOGGED_IN, { admin })
 *    @OnEvent(AdminEvents.ADMIN_LOGGED_IN)
 *
 *    1. 오타 봉쇄:
 *       AdminEvents.ADMIN_LOGED_IN ← TypeScript가 즉시 "그런 속성 없다" 에러.
 *
 *    2. 자동완성 지원:
 *       AdminEvents.까지 입력하면 IDE가 모든 이벤트 후보를 띄움.
 *
 *    3. 이름 변경 = 한 곳만 수정:
 *       이 파일의 값('admin.logged_in')만 바꾸면 사용처는 모두 자동 반영.
 *       (참조는 상수 이름으로 하므로 값 변경에 영향 안 받음)
 *
 *    4. "단일 출처(Single Source of Truth)" 원칙:
 *       이벤트 이름이라는 지식이 코드 안에 단 한 군데에만 존재.
 *       → 일관성 보장 + 유지보수 용이.
 *
 * [ 사용 흐름 ]
 *   1. admin.service.ts에서 발행:
 *      this.eventEmitter.emit(AdminEvents.ADMIN_LOGGED_IN, { admin })
 *   2. admin.listener.ts에서 수신:
 *      @OnEvent(AdminEvents.ADMIN_LOGGED_IN)
 *      async handleAdminLoggedInEvent(payload) {...}
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. Magic String 안티 패턴
 * 2. 단일 출처(Single Source of Truth) 원칙
 * 3. 상수 객체 패턴 (객체로 상수들 묶기)
 * 4. 명명 규칙(Naming Convention)
 * ============================================================
 */

/**
 * ============================================================
 * [ 상수 객체 패턴의 문법 분석 ]
 *
 * 1. export const AdminEvents = { ... }
 *    - export: 다른 파일에서 import 할 수 있게 외부에 공개.
 *    - const:  재할당 불가. AdminEvents = ... 같은 덮어쓰기 방지.
 *      (단, 객체 내부 속성은 const만으로는 변경 가능 → Object.freeze() 또는
 *      as const 사용으로 더 엄격하게 잠글 수 있음. 아래 참고.)
 *
 * 2. 명명 규칙(Naming Convention):
 *    - 상수 객체의 키: SCREAMING_SNAKE_CASE (대문자 + 언더스코어)
 *      → "이건 상수다"라는 시각적 신호.
 *    - 값(이벤트명): 'domain.action' 형태 (점 표기법)
 *      → 도메인.동작 형태로 적으면 어느 도메인에서 발생하는 이벤트인지 명확.
 *      → 검색도 쉬움 (예: 'admin.'로 검색하면 관리자 관련 이벤트가 다 나옴).
 *
 * 3. as const를 붙이지 않은 이유:
 *    - 현재는 값으로 사용하는 데 문제가 없어서 안 붙임.
 *    - 더 엄격하게 타입까지 'admin.logged_in' 리터럴 타입으로 고정하고 싶다면
 *      `} as const;`를 끝에 붙이면 됨.
 *    - as const를 붙이면:
 *      AdminEvents.ADMIN_LOGGED_IN의 타입이 string이 아닌 'admin.logged_in' 자체가 됨.
 *      → @OnEvent 파라미터 타입 추론이 더 정확해지는 장점.
 *
 * 4. 비슷한 대안: enum 사용
 *    enum AdminEvents { ADMIN_LOGGED_IN = 'admin.logged_in' }
 *    - 객체 vs enum 차이는 취향. 객체 + as const가 트리쉐이킹/번들 크기 면에서 유리.
 * ============================================================
 */
export const AdminEvents = {
    ADMIN_LOGGED_IN: 'admin.logged_in',
};
