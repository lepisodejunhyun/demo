# 회사 컴퓨터에서 이어서 작업할 내용

집 컴퓨터에서 작업한 부분을 회사에서 이어서 마무리하기 위한 체크리스트입니다. 순서대로 진행하면 됩니다.

> [!NOTE]
> 집에서 작업한 부분:
> - Prisma 스키마 3종 (Member / SocialAccount / Inquiry)
> - admin server의 Inquiry 관리 모듈 (controller/service/dto)
>
> 회사에서 이어서 할 것:
> - DB 마이그레이션
> - 새 nx 앱 (server-shop) 생성
> - server-shop의 Member 모듈 + 인증 + Inquiry 모듈
> - shop 앱의 회원가입/로그인/1:1 문의 페이지
> - admin 앱의 Inquiry 관리 페이지

---

## Step 1: 코드 받기

```bash
cd ~/path/to/demo   # 회사 프로젝트 폴더
git pull
```

집에서 push한 변경사항을 받습니다. 충돌이 있으면 사용 안 한 회사 컴퓨터의 변경사항을 우선해도 OK.

---

## Step 2: 의존성 확인

```bash
pnpm install
```

집에서 새 의존성을 추가하지는 않았지만, 혹시 git pull로 package.json이 갱신됐을 수 있으니 한 번 실행. 변경 없으면 그냥 빠르게 끝남.

---

## Step 3: DB에 새 스키마 반영

```bash
pnpm prisma db push
```

이 명령이 하는 일:
1. `prisma/` 폴더의 `.prisma` 파일들 분석.
2. DB와 비교해서 차이 자동 적용:
   - `Member` 테이블 생성
   - `SocialAccount` 테이블 생성
   - `Inquiry` 테이블 생성
   - `InquiryStatus`, `AuthProvider` enum 생성
3. `@prisma/client` 타입 자동 재생성.

> [!TIP]
> 진행 후 `pnpm prisma studio`로 GUI를 열어서 새 테이블들이 잘 만들어졌는지 확인.

---

## Step 4: admin server (기존) — Inquiry 모듈 활성화

집에서 이미 [apps/server/src/app/inquiry/](../apps/server/src/app/inquiry/) 폴더의 코드는 작성해뒀습니다. **[apps/server/src/app/app.module.ts](../apps/server/src/app/app.module.ts) 에 InquiryModule import 추가**되었는지 확인:

```ts
import { InquiryModule } from './inquiry/inquiry.module';

@Module({
    imports: [..., InquiryModule],
    ...
})
```

> 이건 집에서 이미 추가해뒀음. pull 후 확인만.

server 재시작 후 `http://localhost:3000/reference` 에서 `inquiry` 그룹의 API들이 잘 보이는지 확인.

---

## Step 5: 새 server-shop 앱 생성

```bash
pnpm nx g @nx/nest:app server-shop
```

이 명령이 자동으로 만드는 것:
- `apps/server-shop/` 폴더
- 기본 NestJS 보일러플레이트 (main.ts, app.module.ts, app.controller.ts, app.service.ts)
- `apps/server-shop-e2e/` E2E 테스트 폴더
- `project.json` (Nx 설정)
- `tsconfig.app.json`, `tsconfig.json`, `tsconfig.spec.json`
- `nx serve server-shop`, `nx build server-shop` 명령 활성화

> [!IMPORTANT]
> 생성 시 옵션 질문이 나올 수 있어요. 기본값(Enter)으로 진행해도 OK.

생성 후 폴더 구조 확인:
```bash
ls apps/server-shop/
```

---

## Step 6: server-shop 기본 설정

생성된 [apps/server-shop/src/main.ts](../apps/server-shop/src/main.ts)를 [apps/server/src/main.ts](../apps/server/src/main.ts)와 유사하게 수정합니다. 차이점:

- 포트: 3001 (admin server는 3000)
- CORS origin: `http://localhost:4201` (shop 앱이 4201로 동작한다면)
- 글로벌 prefix: `'api'`
- ValidationPipe 적용
- ng-openapi-gen으로 client 자동 생성: `libs/api-client-shop/` (admin과 별도)

> 자세한 코드는 회사 진행 시점에 보강해드릴게요.

---

## Step 7: server-shop의 PrismaModule 사용 결정

여기서 결정해야 할 것:
- **옵션 A**: `apps/server/src/prisma/` 의 PrismaModule을 그대로 import (같은 코드 공유)
- **옵션 B**: server-shop에 별도 PrismaModule 작성 (코드 중복)
- **옵션 C**: `libs/prisma/` 같이 공통 라이브러리로 추출

추천은 **옵션 C** (libs로 추출). 둘 다 공유하기 가장 깔끔. 이건 회사에서 nx 명령으로 진행:
```bash
pnpm nx g @nx/nest:library prisma
```

당장은 시간 절약을 위해 **옵션 B** (server-shop에 별도 PrismaModule)로 빠르게 진행해도 OK. 나중에 추출.

---

## Step 8: server-shop에 Member 모듈 작성

다음 파일들을 만듭니다:

```
apps/server-shop/src/app/member/
├── member.module.ts
├── member.controller.ts
├── member.service.ts
├── dtos/
│   ├── member.dto.ts                  (응답)
│   ├── member-signup.dto.ts           (회원가입 요청)
│   └── member-signin.dto.ts           (로그인 요청)
├── guards/
│   └── jwt-auth.guard.ts              (회원 전용 가드)
└── strategies/
    └── jwt.strategy.ts                (JWT 검증 전략)
```

### Member.controller.ts 엔드포인트

| HTTP | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| POST | `/api/members/signup` | ❌ | 회원가입 |
| POST | `/api/members/signin` | ❌ | 로그인 (JWT 발급) |
| GET | `/api/members/me` | ✅ Member JWT | 본인 정보 |

### 인증 흐름

1. 회원가입 → password를 bcrypt로 해시 → Member 테이블에 저장.
2. 로그인 → email로 조회 → 비밀번호 비교 → JWT 발급 (`{ sub: memberId, type: 'member' }`).
3. 인증 필요한 API → 클라이언트가 `Authorization: Bearer <token>` 헤더 첨부 → JwtAuthGuard가 검증.

### 검증 규칙 (admin과 동일)

```ts
@MinLength(8) @MaxLength(16)
@Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])/)
password: string;
```

---

## Step 9: server-shop에 Inquiry (사용자용) 모듈 작성

정책의 "사용자 페이지" 부분에 해당하는 API.

```
apps/server-shop/src/app/inquiry/
├── inquiry.module.ts
├── inquiry.controller.ts
├── inquiry.service.ts
└── dtos/
    ├── inquiry.dto.ts                 (응답 — admin과 거의 동일)
    └── inquiry-create.dto.ts          (작성/수정)
```

### Inquiry.controller.ts 엔드포인트

모두 Member JWT 인증 필요.

| HTTP | Path | 설명 |
| --- | --- | --- |
| GET | `/api/inquiries` | 본인 문의 목록 |
| GET | `/api/inquiries/:id` | 본인 문의 상세 (답변 완료일 때만 답변 표시) |
| POST | `/api/inquiries` | 신규 작성 (이미지 최대 3장) |
| PATCH | `/api/inquiries/:id` | 본인 수정 (답변 대기 상태일 때만) |
| DELETE | `/api/inquiries/:id` | 본인 삭제 |

### 권한 체크

각 핸들러에서 "본인 문의인지" 검증 필수:
```ts
if (inquiry.memberId !== currentMember.id) {
    throw new ForbiddenException('본인 문의만 접근 가능합니다.');
}
```

---

## Step 10: shop 앱 페이지 작업

```
apps/shop/src/app/pages/
├── auth/
│   ├── sign-in/                       (로그인)
│   └── sign-up/                       (회원가입)
└── inquiry/
    ├── inquiry.page.ts                (목록)
    ├── inquiry-detail/                (상세)
    └── inquiry-form/                  (작성/수정)
```

### shop 라우트 추가

[apps/shop/src/app/app.routes.ts](../apps/shop/src/app/app.routes.ts) 에 라우트 정의:
- `/sign-up` — 회원가입
- `/sign-in` — 로그인
- `/inquiry` — 본인 문의 목록 (인증 가드)
- `/inquiry/create` — 작성
- `/inquiry/:id` — 상세
- `/inquiry/:id/edit` — 수정

### shop의 api-client 설정

admin과 마찬가지로 `provideApiConfiguration('http://localhost:3001')` 추가.

### 비회원 접근 시 로그인 페이지로

정책: "비회원 접근 시 로그인 페이지로 이동, 로그인 완료 후 원래 페이지로 자동 이동".

→ Angular의 `CanActivate` 가드 (`AuthGuard`) 사용:
```ts
canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (!this.authService.isLoggedIn()) {
        this.router.navigate(['/sign-in'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }
    return true;
}
```

로그인 성공 후:
```ts
const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
this.router.navigate([returnUrl]);
```

---

## Step 11: admin 앱 - Inquiry 관리 페이지

```
apps/admin/src/app/pages/inquiry/
├── inquiry.page.ts                    (목록)
└── inquiry-detail/
    └── inquiry-detail.page.ts         (상세 + 답변 작성)
```

### 라우트 추가

[apps/admin/src/app/app.routes.ts](../apps/admin/src/app/app.routes.ts):
- `/inquiry` — 목록
- `/inquiry/:id` — 상세 + 답변

### 사이드바 메뉴 확인

이미 [sidebar.component.ts:25](../apps/admin/src/app/layout/sidebar/sidebar.component.ts#L25)에 "1:1 문의" 메뉴가 있을 거예요. 경로만 일치하면 OK.

### 답변 작성 UI

정책: 상세 페이지에서 답변 작성/수정 + "답변 저장 시 상태가 '답변 대기'면 상태 변경 여부 확인".

→ `confirm()` 다이얼로그:
```ts
async onSaveAnswer() {
    if (this.inquiry.status === '답변_대기') {
        const changeStatus = confirm('답변을 저장하면서 상태를 "답변 완료"로 변경하시겠습니까?');
        await this.api.invoke(inquiryControllerUpdateAnswer, {
            id: this.inquiry.id,
            body: {
                answer: this.answerForm.value.answer,
                status: changeStatus ? '답변_완료' : undefined,
            },
        });
    } else {
        await this.api.invoke(inquiryControllerUpdateAnswer, {
            id: this.inquiry.id,
            body: { answer: this.answerForm.value.answer },
        });
    }
}
```

---

## Step 12: 동작 테스트 시나리오

### 회원가입/로그인
1. shop 앱 (`http://localhost:4201/sign-up`) 접속
2. 회원가입 → 자동으로 로그인됨 (또는 로그인 페이지로)
3. 로그인 → JWT가 발급되고 localStorage 저장

### 1:1 문의 작성 (shop)
1. 로그인 상태에서 `/inquiry/create` 접속
2. 제목/내용/이미지 입력
3. 등록 → 목록에서 자기 문의 확인

### 답변 작성 (admin)
1. admin 앱 (`http://localhost:4200/inquiry`) 접속
2. 새로 등록된 문의 클릭
3. 답변 입력 → 저장 시 "답변 완료로 변경할까요?" 다이얼로그 → 예
4. 상태가 '답변 완료'로 바뀜

### shop에서 답변 확인
1. shop에서 본인 문의 상세 다시 접속
2. 답변 내용 표시됨 (정책: '답변 완료'일 때만 표시)

### 권한 침범 시도
1. 다른 회원의 문의 ID로 직접 GET 요청 → 403 Forbidden

---

## 체크리스트 (한눈에 보기)

### 환경 세팅
- [ ] git pull
- [ ] pnpm install
- [ ] pnpm prisma db push
- [ ] pnpm nx g @nx/nest:app server-shop

### 서버 작업
- [ ] server-shop 기본 설정 (main.ts, app.module.ts)
- [ ] server-shop PrismaModule 처리 (옵션 A/B/C 중 선택)
- [ ] server-shop Member 모듈 (signup/signin/me)
- [ ] server-shop JWT 인증 설정 (passport + JwtAuthGuard)
- [ ] server-shop Inquiry 모듈 (CRUD + 본인 권한 체크)
- [ ] admin server의 Inquiry 모듈 활성화 확인

### shop 앱
- [ ] api-client 설정 (포트 3001)
- [ ] AuthService (토큰 관리)
- [ ] AuthInterceptor (Bearer 자동 첨부)
- [ ] AuthGuard (라우트 보호)
- [ ] 회원가입 페이지
- [ ] 로그인 페이지
- [ ] 1:1 문의 목록 페이지
- [ ] 1:1 문의 작성 페이지
- [ ] 1:1 문의 상세 페이지
- [ ] 1:1 문의 수정 페이지

### admin 앱
- [ ] Inquiry 관리 목록 페이지
- [ ] Inquiry 상세 + 답변 작성 페이지
- [ ] 라우트 등록
- [ ] 사이드바 메뉴 경로 확인

### 테스트
- [ ] 회원가입 → 로그인 → 토큰 발급 확인
- [ ] shop에서 문의 작성 → DB 확인
- [ ] admin에서 답변 → 상태 변경
- [ ] shop에서 답변 확인 (답변 완료 상태일 때만)
- [ ] 본인 외 문의 접근 시 403

---

## 작업 시 막힐 만한 부분

| 막힘 | 해결 |
| --- | --- |
| `pnpm nx g @nx/nest:app` 실행이 안 됨 | `@nx/nest` 플러그인 누락. `pnpm add -D @nx/nest`로 추가 후 재시도 |
| JWT secret 어디 두지? | `.env`에 `JWT_SECRET_MEMBER=...` 추가. 코드에선 `process.env.JWT_SECRET_MEMBER` |
| passport / @nestjs/jwt 없음 | `pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt && pnpm add -D @types/passport-jwt` |
| api-client 가 두 서버용으로 안 만들어짐 | server-shop의 main.ts에서도 ng-openapi-gen 호출. output 경로는 `libs/api-client-shop/`처럼 다르게 |
| shop에 admin과 같은 컴포넌트 쓰고 싶음 | 공통 컴포넌트를 `libs/ui/`로 추출. 또는 일단 shop에 별도로 만들고 나중에 통합 |

---

## 다음 학습 흐름

이 단계를 다 마치면:
- 인증 시스템 (JWT, Guard, Strategy)에 대한 이해
- 두 서버 운영 경험
- 사용자 권한 분리 패턴
- shop SSR(Angular) 경험

까지 얻습니다. 모르는 부분이 생기면 그때그때 물어봐 주세요.
