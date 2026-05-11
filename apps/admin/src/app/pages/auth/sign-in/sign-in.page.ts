/**
 * ============================================================
 * [ Angular Component란? ]
 * 화면에 보이는 UI의 한 조각. HTML(모양) + TypeScript(동작)을 하나로 묶은 것.
 *
 * 예: 이 파일 = 로그인 페이지 컴포넌트
 *     sign-in.page.ts   → 동작 (버튼 클릭하면 뭘 할지)
 *     sign-in.page.html → 모양 (입력칸, 버튼 등의 배치)
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. @Component()      — 컴포넌트 정의 데코레이터
 * 2. inject()          — 서비스 주입 (Angular 최신 방식)
 * 3. FormGroup/Control — 폼(양식) 관리 (Reactive Forms)
 * 4. Validators        — 입력값 검증 (필수, 이메일, 길이 등)
 * 5. api.invoke()      — API 호출 (서버와 통신)
 * 6. Router.navigate() — 페이지 이동
 * 7. async/await       — 비동기 처리 (서버 응답 기다리기)
 * 8. try/catch         — 에러 처리
 * ============================================================
 */

import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { adminControllerSignin, Api } from "@api-client";
import { AdminStore } from "../../../stores/admin.store";
import { Router } from "@angular/router";

/**
 * @Component({...})
 * → 이 클래스가 Angular 컴포넌트임을 선언.
 *
 * selector:    HTML에서 <app-sign-in></app-sign-in>으로 사용할 수 있는 태그명.
 * templateUrl: 이 컴포넌트의 HTML 파일 경로. (모양 담당)
 * imports:     이 컴포넌트에서 사용하는 Angular 모듈들.
 *              CommonModule       → @if, @for 같은 기본 지시자
 *              ReactiveFormsModule → FormGroup, FormControl 사용에 필요
 */
@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in.page.html',
    imports: [CommonModule, ReactiveFormsModule],
})

/**
 * [ export default class ]
 * export default → 이 파일을 import할 때 중괄호 {} 없이 가져올 수 있음.
 *   사용처: app.routes.ts에서 loadComponent: () => import('./sign-in.page')
 *   loadComponent가 default export를 자동으로 찾아서 로딩함.
 *
 * 만약 export default가 아니면:
 *   loadComponent: () => import('./sign-in.page').then(m => m.SignInPage) ← 더 번거로움
 */
export default class SignInPage {
    /**
     * [ inject() — Angular 서비스 주입 (최신 방식) ]
     *
     * NestJS의 constructor 주입과 비슷하지만, Angular에서는 inject() 함수를 권장.
     *
     * Api        → API 호출 도구. 서버와 통신할 때 사용.
     *              api.invoke(함수, 파라미터)로 호출.
     * AdminStore → 로그인한 사용자 정보를 앱 전체에서 공유하는 저장소.
     * Router     → 페이지 이동 도구. router.navigate(['/dashboard'])로 이동.
     *
     * private:  이 클래스 안에서만 사용 (HTML 템플릿에서 접근 불가).
     *           HTML에서 쓸 일 없는 서비스는 private으로 숨기는 게 좋음.
     * readonly: 한번 할당 후 변경 불가. 실수로 덮어쓰기 방지.
     */
    private readonly api = inject(Api);
    private readonly adminStore = inject(AdminStore);
    private readonly router = inject(Router);

    /**
     * errorMessage — 로그인 실패 시 에러 메시지를 담는 변수.
     * HTML에서 {{ errorMessage }}로 표시.
     * private이 없음 → HTML 템플릿에서 접근 가능 (의도적으로 public).
     */
    errorMessage = '';

    /**
     * [ FormGroup — 폼(양식) 관리 ]
     *
     * FormGroup = 여러 입력칸(FormControl)을 하나의 그룹으로 묶는 도구.
     * 이 폼에는 email, password 두 개의 입력칸이 있음.
     *
     * 각 FormControl의 구조:
     *   첫 번째 인자: 초기값 ('' = 빈 문자열)
     *   validators:   입력값 검증 규칙 배열
     *   nonNullable:  값이 절대 null이 되지 않음 (reset해도 초기값으로 돌아감)
     */
    form = new FormGroup({
        email: new FormControl('', {
            validators: [
                Validators.required,  // 필수 입력
                Validators.email,     // 이메일 형식 (xxx@xxx.xxx)
            ],
            nonNullable: true,
        }),
        password: new FormControl('', {
            validators: [
                Validators.required,            // 필수 입력
                Validators.minLength(8),         // 최소 8자
                Validators.maxLength(16),        // 최대 16자
                Validators.pattern(              // 정규식: 영문+숫자+특수문자 조합 필수
                    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
                )
            ],
            nonNullable: true,
        }),
    });

    /**
     * [ 키보드 이벤트 핸들러 ]
     * HTML에서 (keydown)="keydownHandler($event)"으로 연결.
     * Enter 키를 누르면 submit() 실행 → 로그인 버튼 안 눌러도 Enter로 제출 가능.
     */
    keydownHandler(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.submit();
        }
    }

    /**
     * [ 로그인 제출 함수 ]
     *
     * async — 이 함수 안에서 await(서버 응답 기다리기)를 쓸 수 있게 해줌.
     *
     * 흐름:
     * 1. 폼 검증 → 실패하면 아무것도 안 함
     * 2. 폼에서 입력값 꺼내기
     * 3. 서버에 로그인 요청 보내기 (api.invoke)
     * 4. 성공 → Store에 사용자 저장 + 대시보드로 이동
     * 5. 실패 → 에러 메시지 표시
     */
    async submit() {
        /** 폼이 유효하지 않으면 (검증 실패) 즉시 종료. */
        if (this.form.invalid) return;

        /**
         * getRawValue() — 폼의 모든 입력값을 객체로 꺼냄.
         * 결과: { email: '입력한이메일', password: '입력한비밀번호' }
         */
        const values = this.form.getRawValue();

        /**
         * [ try/catch — 에러 처리 ]
         * try 안의 코드를 실행하다 에러가 발생하면 → catch 블록으로 이동.
         * API 호출은 네트워크 오류, 서버 에러 등 실패할 수 있으므로 반드시 try/catch 사용.
         */
        try {
            /**
             * [ api.invoke(함수, 파라미터) — API 호출 ]
             *
             * adminControllerSignin: 서버의 POST /api/admins/signin에 대응하는 함수.
             *   (서버 실행 시 ng-openapi-gen이 자동 생성한 함수)
             *
             * body: 서버에 보낼 데이터 (= @Body()로 받는 데이터)
             *
             * await: 서버 응답이 올 때까지 기다림.
             *        응답이 오면 user 변수에 AdminDTO 객체가 담김.
             */
            const user = await this.api.invoke(adminControllerSignin, {
                body: {
                    email: values.email,
                    password: values.password,
                },
            });

            console.log('로그인 성공');

            /** AdminStore에 로그인한 사용자 정보 저장 → 앱 전체에서 접근 가능 */
            this.adminStore.setUser(user);

            /** 대시보드 페이지로 이동. navigate([경로])는 프로그래밍 방식의 페이지 이동. */
            this.router.navigate(['/dashboard']);
        } catch (error: any) {
            /**
             * 서버가 보낸 에러 메시지를 추출하여 화면에 표시.
             * error?.error?.message → 옵셔널 체이닝: 중간에 null이면 undefined 반환 (에러 안 남).
             * || '로그인에 실패했습니다.' → 메시지가 없으면 기본 메시지 사용.
             */
            this.errorMessage = error?.error?.message || '로그인에 실패했습니다.';
        }
    }
}
