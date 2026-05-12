/**
 * ============================================================
 * [ 상세 페이지 컴포넌트란? ]
 * URL의 파라미터(예: /faq/abc123 의 'abc123')를 받아서
 * 해당 데이터를 서버에서 조회해 화면에 보여주는 페이지.
 *
 * sign-in.page.ts(입력 폼 페이지)와의 차이:
 *   sign-in.page.ts → 사용자 입력을 받아 서버로 보냄 (쓰기 위주)
 *   faq-detail.page.ts → URL 파라미터로 데이터를 조회해 표시 (읽기 위주)
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. 인터페이스(interface)와 implements    — 클래스가 지켜야 할 "약속"
 * 2. 생명주기 훅(Lifecycle Hook) / OnInit / ngOnInit — 컴포넌트의 인생 단계 콜백
 * 3. 제네릭(Generic) / input<T>()         — 타입을 매개변수처럼 받는 문법
 * 4. signal 기반 input                    — Angular 17+의 라우트 파라미터 자동 주입
 * 5. Promise / async / await              — 비동기 처리 3종 세트
 * 6. try / catch                          — 예외(에러) 처리
 * 7. Router.navigate()                    — 코드로 페이지 이동
 * ============================================================
 */

import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { Api, faqControllerFindById, faqControllerRemove, FaqDto } from "@api-client";

/**
 * @Component({...})
 * selector / templateUrl / imports의 의미는 sign-in.page.ts 주석 참고.
 * 이 컴포넌트는 CommonModule만 import — 폼이 없어서 ReactiveFormsModule 불필요.
 */
@Component({
    selector: 'app-faq-detail',
    templateUrl: './faq-detail.page.html',
    imports: [CommonModule, RouterLink]
})

/**
 * ============================================================
 * [ 인터페이스(interface)란? ]
 * 1. 개념: 클래스가 "어떤 메서드/속성을 반드시 가져야 하는지"를 정의한 명세서(약속).
 *          실제 구현 코드는 없고, "이런 모양이어야 한다"는 스펙만 적혀 있음.
 *
 * 2. 비유: 채용 공고와 같음.
 *          "React 3년 + TypeScript 가능자"라는 조건만 적혀 있고,
 *          실제 어떻게 일할지는 지원자(클래스)가 정함.
 *
 * 3. 클래스(class)와의 차이:
 *    - class:     실제 동작하는 코드(필드 + 메서드 구현)를 가짐.
 *    - interface: 필드/메서드의 "이름과 타입"만 가짐. 동작 없음.
 *
 * 4. TypeScript 전용 개념:
 *    - 자바스크립트에는 interface가 없음. 컴파일되면 사라짐.
 *    - 즉, 런타임에는 영향이 0. 오직 "개발 단계 타입 체크"용.
 *
 * [ implements 키워드란? ]
 * 1. 개념: "나 이 인터페이스의 약속을 지킬게"라는 선언.
 * 2. 문법: class 클래스이름 implements 인터페이스이름 { ... }
 * 3. 효과:
 *    - 인터페이스에 정의된 메서드를 빠뜨리면 TypeScript가 컴파일 에러로 잡음.
 *    - 오타도 잡음. (예: ngOninit ← 'i' 소문자 → "ngOnInit 없네요" 에러)
 * 4. 장점:
 *    - "이 클래스가 무슨 역할을 하는지" 한 줄로 파악 가능.
 *    - implements OnInit ← 보자마자 "아, ngOnInit 쓰는구나" 알 수 있음.
 *
 * ============================================================
 * [ 생명주기 훅(Lifecycle Hook)이란? ]
 * 1. 개념: 컴포넌트의 "인생 단계(생성-갱신-소멸)"에서 Angular가 자동으로 호출하는 콜백.
 * 2. 비유: 사람의 인생 단계마다 자동으로 일어나는 일.
 *          - 태어남(생성) → 첫 울음
 *          - 자라남(갱신) → 키 측정
 *          - 떠남(소멸)   → 작별 인사
 *          → 컴포넌트도 비슷한 단계가 있고, Angular가 알아서 콜백을 불러줌.
 * 3. 종류 (자주 쓰는 것들):
 *    | 인터페이스      | 메서드             | 호출 시점                              |
 *    |---------------|-------------------|---------------------------------------|
 *    | OnInit        | ngOnInit          | 컴포넌트 생성 직후 (input 주입 끝난 뒤) |
 *    | OnChanges     | ngOnChanges       | input 값이 바뀔 때마다                  |
 *    | AfterViewInit | ngAfterViewInit   | HTML 템플릿이 그려진 직후              |
 *    | OnDestroy     | ngOnDestroy       | 컴포넌트가 사라지기 직전 (정리 작업용)   |
 * 4. 공통 규칙: 인터페이스 이름은 OnXxx, 실제 메서드 이름은 ngOnXxx.
 *
 * [ OnInit 인터페이스가 정확히 어떻게 생겼는가? ]
 * @angular/core 안에 이렇게 정의되어 있음:
 *   export interface OnInit {
 *     ngOnInit(): void;
 *   }
 * → "implements OnInit 한 클래스는 ngOnInit() 메서드를 반드시 만들어라"는 약속.
 *
 * [ 왜 메서드 이름이 'ngOnInit'이어야 하는가? ]
 * 1. Angular 프레임워크가 정확히 그 이름으로 메서드를 찾아 호출하기 때문.
 *    내부 코드(개념 표현):
 *      if (typeof component.ngOnInit === 'function') component.ngOnInit();
 * 2. 'ng' 접두사는 Angular가 예약한 영역.
 *    → 사용자 정의 메서드 onInit()과 충돌하지 않도록 분리.
 *
 * [ implements 없이도 ngOnInit이 동작하는가? ]
 * 동작은 함. Angular는 메서드 이름만으로 찾기 때문.
 * 하지만 implements OnInit을 붙이면 오타를 컴파일 단계에서 잡아주므로 권장.
 *
 * [ 왜 constructor가 아니라 ngOnInit인가? ]
 * 1. constructor: 컴포넌트 객체가 메모리에 막 생성되는 "순간".
 *    → input(), 라우터 파라미터, @Input 값 등이 아직 채워지기 전.
 *    → this.id() 접근 시 undefined일 수 있음.
 * 2. ngOnInit:    Angular가 input/파라미터를 모두 채워준 "직후".
 *    → this.id() 호출하면 안전하게 'abc' 등 실제 값을 받음.
 * 결론: "외부에서 주입받은 값으로 뭔가 하는 초기화"는 무조건 ngOnInit에서.
 * ============================================================
 */
export default class FaqDetailPage implements OnInit {
    /**
     * [ inject() — 서비스 주입 ]
     * sign-in.page.ts 주석에서 자세히 설명함. 여기서는 핵심만:
     *   private readonly → 클래스 내부 전용 + 한번 주입되면 변경 불가.
     */
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    /**
     * ============================================================
     * [ 제네릭(Generic) — input<string>() 의 <string> 부분 ]
     * 1. 개념: 함수/클래스에 "타입을 매개변수처럼 전달"하는 문법.
     *          꺽쇠 괄호 <T> 안에 타입을 넣어주는 형태.
     *
     * 2. 왜 필요한가?
     *    같은 동작인데 타입만 다른 코드를 반복해서 안 만들기 위해.
     *    예: input<string>(), input<number>(), input<User>() 모두 같은 input() 함수.
     *
     * 3. 비유: 택배 상자.
     *          input() 함수는 "포장 시스템". 안에 string이 들어가든 number가 들어가든
     *          포장 방식은 동일. 다만 받는 사람은 "내 상자엔 string이 들어있다"고 알아야 함.
     *          → <string>이 그 라벨.
     *
     * 4. 효과 (없으면 vs 있으면):
     *    - id = input();          → 타입이 unknown. id() 결과로 뭐가 나올지 알 수 없음.
     *    - id = input<string>();  → 타입이 string|undefined. 자동완성/타입체크 가능.
     *
     * 5. 다른 제네릭 예시:
     *    Array<string> = string 배열, Promise<User> = User를 약속한 Promise,
     *    Observable<number> = number를 흘려보내는 Observable.
     *
     * ============================================================
     * [ signal 기반 input — Angular 17+ ]
     * 1. 일반 변수 vs signal vs input():
     *    - 일반 변수:        let id = ''         (단순 값. 변경 감지 X)
     *    - signal:           id = signal('')     (스스로 변경 가능 + 반응형)
     *    - input():          id = input<string>() (외부에서만 변경 가능 + 반응형)
     *
     * 2. 동작 흐름:
     *    [1] app.routes.ts:  path: 'faq/:id'   ← URL 패턴 정의
     *    [2] 사용자가 /faq/abc 접속
     *    [3] app.config.ts의 withComponentInputBinding() 활성화 덕분에
     *        Angular Router가 ':id' 값('abc')을 자동으로 이 input에 주입
     *    [4] 컴포넌트에서 this.id() 호출 → 'abc' 반환
     *
     * 3. 함수 호출 형태로 값을 꺼내는 이유?
     *    signal은 "값을 가진 함수"임. 변경 감지 시스템을 위한 구조.
     *    - this.id        → signal 객체 자체 (값 아님)
     *    - this.id()      → 현재 값 ('abc' 또는 undefined)
     *
     * 4. <string>인데 왜 undefined도 나오는가?
     *    라우트가 매칭되기 직전이거나 잘못된 진입 시점에는 값이 아직 없을 수 있음.
     *    정확한 타입: string | undefined.
     *    → 그래서 아래에서 if (!id) return으로 방어.
     *
     * 5. 옛 방식과의 비교 (참고):
     *    constructor(private route: ActivatedRoute) {}
     *    ngOnInit() {
     *      this.route.paramMap.subscribe(p => { ... });   // 구독 + 해제 필요
     *    }
     *    → 이 보일러플레이트가 input<T>() 한 줄로 줄어듦.
     * ============================================================
     */
    id = input<string>();

    /**
     * 화면에 표시할 FAQ 데이터.
     *
     * 초기값 null의 의미: "아직 데이터 로딩 전".
     * 템플릿에서는 @if (faq) { 표시 } @else { 로딩중... } 식으로 분기 가능.
     *
     * FaqDto 타입:
     * - server의 FaqDTO 클래스 → Swagger 스펙 → ng-openapi-gen → FaqDto로 자동 생성됨.
     * - 즉, 서버 응답의 모양과 100% 일치하는 타입.
     * - 서버에서 필드가 추가되면 다음 ng-openapi-gen 실행 시 이 타입도 자동 업데이트.
     */
    faq: FaqDto | null = null;

    /**
     * ============================================================
     * [ Promise란? ]
     * 1. 개념: "지금 당장 결과가 없지만, 나중에 (성공 또는 실패) 결과를 알려줄게"라는 약속 객체.
     *
     * 2. 왜 필요한가?
     *    서버 요청, 파일 읽기, 타이머 등 "시간이 걸리는 작업"은 결과를 즉시 줄 수 없음.
     *    JavaScript는 이런 작업이 끝날 때까지 기다리지 않고 다음 줄로 넘어감(논블로킹).
     *    → 결과를 받을 그릇이 필요 → Promise.
     *
     * 3. 3가지 상태:
     *    - pending(대기):   아직 작업이 끝나지 않음
     *    - fulfilled(성공): 값을 가지고 끝남     → .then(값 => ...) 로 받음
     *    - rejected(실패):  에러를 가지고 끝남   → .catch(에러 => ...) 로 받음
     *
     * 4. 예시:
     *    const p = fetch('/api/foo');  // p는 Promise. 아직 결과 없음.
     *    p.then(res => console.log(res));  // 응답이 오면 콘솔 출력.
     *
     * [ async / await — Promise를 동기 코드처럼 쓰기 ]
     * 1. async: 함수 앞에 붙이면 그 함수는 "항상 Promise를 반환하는 함수"가 됨.
     *           내부에서 await를 사용할 수 있게 해주는 키워드.
     *
     * 2. await: Promise 앞에 붙이면 그 Promise가 끝날 때까지 "함수 실행을 일시 정지" 후
     *           결과 값을 꺼내 변수에 담음.
     *
     * 3. 비교:
     *    .then 방식:
     *      this.api.invoke(...).then(faq => { this.faq = faq; });
     *    async/await 방식:
     *      const faq = await this.api.invoke(...);
     *      this.faq = faq;
     *      → 코드가 위에서 아래로 순서대로 읽혀 훨씬 직관적.
     *
     * 4. 주의: await는 async 함수 안에서만 사용 가능.
     *          그래서 ngOnInit 앞에 async를 붙임.
     * ============================================================
     */
    async ngOnInit() {
        /**
         * this.id() — input signal에서 현재 값을 꺼냄.
         * 결과 타입: string | undefined.
         */
        const id = this.id();

        /**
         * [ 방어 코드(Guard Clause) 패턴 ]
         * id가 falsy(undefined / 빈 문자열 등)면 즉시 함수 종료.
         *
         * 왜 필요한가?
         * - 직접 주소창에 잘못된 URL을 입력했거나
         * - 라우트 정의가 어긋났거나
         * - Angular 초기화 타이밍 문제 등으로
         * id가 비어있는 상태에서 서버를 호출하면 잘못된 요청이 나가게 됨.
         *
         * 가드 클로즈는 "비정상 케이스를 위에서 빨리 잘라내고,
         * 나머지 본문은 정상 케이스만 다루도록" 만드는 표준 패턴.
         */
        if (!id) return;

        /**
         * ============================================================
         * [ try / catch — 예외 처리 ]
         * 1. 개념: 코드 실행 중 에러(예외)가 발생하면 프로그램이 멈추는데,
         *          그 에러를 잡아서(catch) 다른 처리로 넘기는 구조.
         *
         * 2. 비유: 보험. 사고(에러)가 났을 때 자동차(프로그램)가 멈추지 않고
         *          보험회사(catch 블록)가 처리해줌.
         *
         * 3. 문법:
         *    try {
         *      위험할 수 있는 코드
         *    } catch (error) {
         *      에러가 발생했을 때 실행될 코드
         *    } finally {
         *      성공/실패와 무관하게 항상 실행 (선택)
         *    }
         *
         * 4. 언제 쓰는가?
         *    - 네트워크 요청 (서버 다운, 4xx, 5xx 응답)
         *    - 파일 읽기 (파일 없음)
         *    - JSON 파싱 (잘못된 형식)
         *    - 즉, "내가 통제할 수 없는 외부 요인"이 개입할 때.
         *
         * 5. async/await에서의 try/catch:
         *    await로 받은 Promise가 reject(실패) 상태면 그 에러가 try 블록을 빠져나와
         *    catch로 잡힘. .then().catch() 방식보다 흐름이 자연스러움.
         * ============================================================
         */
        try {
            /**
             * [ api.invoke(생성된함수, 파라미터) — 서버 호출 ]
             *
             * faqControllerFindById:
             * server/faq.controller.ts의 @Get(':id')에 대응하는 자동 생성 함수.
             * (server/main.ts의 generateApiClient가 만든 결과)
             *
             * { id: id } → 경로 파라미터로 사용됨.
             *   → 실제 요청 URL: GET http://localhost:3000/api/faqs/{id}
             *
             * await의 효과:
             * - api.invoke()는 Promise<FaqDto>를 반환.
             * - await가 그 Promise를 풀어 FaqDto 객체를 꺼냄.
             * - 응답이 도착할 때까지 ngOnInit은 이 줄에서 멈춰 있음(논블로킹 대기).
             *
             * 타입 자동 추론: 결과 타입이 FaqDto로 정확히 잡힘 → this.faq에 안전 대입.
             */
            this.faq = await this.api.invoke(faqControllerFindById, {
                id: id,
            });
            this.cdr.markForCheck();
        } catch (error) {
            /**
             * 실패 케이스들:
             *   - 404: 해당 id의 FAQ가 DB에 없음 (서버의 NotFoundException)
             *   - 5xx: 서버 내부 오류
             *   - 네트워크 단절
             *
             * 처리 정책:
             * 1. 개발자용: console.error로 콘솔에 에러 정보 기록.
             *    (production에서는 Sentry 같은 모니터링 도구로 보내는 게 보통)
             * 2. 사용자용: FAQ 목록 페이지로 자동 이동 → "막다른 길"에 갇히지 않게.
             *    공백 페이지를 보여주는 것보다 UX가 훨씬 좋음.
             *
             * [ Router.navigate(['/경로']) ]
             * 1. 개념: 코드로(=프로그래밍 방식으로) 페이지 이동시키는 메서드.
             * 2. 링크 클릭과의 차이:
             *    - <a routerLink="/faq"> = HTML에서 사용자가 클릭해야 동작.
             *    - this.router.navigate(['/faq']) = 코드 흐름 중에 강제로 이동.
             * 3. 배열로 받는 이유: 동적 세그먼트를 조합할 수 있게 함.
             *    예: this.router.navigate(['/faq', faq.id]) → /faq/{id}
             */
            console.error('FAQ 조회 실패', error);

            this.router.navigate(['/faq']);
        }

    }

    async onDelete() {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await this.api.invoke(faqControllerRemove, {
                id: this.faq!.id,
            });
            this.router.navigate(['/faq']);
        } catch (error) {
            console.error('FAQ 삭제 실패', error);
        }
    }
}
