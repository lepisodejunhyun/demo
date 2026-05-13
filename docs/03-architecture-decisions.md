# 왜 이렇게 만들었나? — 기술 선택 이유

이 문서는 이 프로젝트가 **왜 이런 기술 조합으로 만들어졌는지**, 그리고 각 선택이 어떤 문제를 해결하는지 설명합니다. "이미 만들어진 코드"가 아니라 "이 코드가 왜 이 모양인지"에 답하는 문서입니다.

> 개발은 처음 접하는 분도 이해할 수 있도록 비유와 실생활 예시 위주로 풀어 씁니다.

---

## 0. 전체 구성 한눈에 보기

```
[관리자(브라우저)]
       │
       │ HTTP 요청 (JSON)
       ▼
[Angular 앱 (admin)]
       │
       │ api.invoke (자동 생성된 클라이언트)
       ▼
[NestJS 서버 (server)]
       │
       │ Prisma 메서드
       ▼
[PostgreSQL DB (docker)]
```

각 영역의 선택을 하나씩 풀어보겠습니다.

---

## 1. 왜 Nx 모노레포(Monorepo)인가?

### 모노레포 vs 멀티레포

**멀티레포 (전통적인 방식)**:
- 서버 코드는 server-repo에 따로.
- admin 앱 코드는 admin-repo에 따로.
- 공유할 코드(예: 타입 정의)는 또 다른 repo에 두고 npm 패키지로 배포.

**모노레포 (Nx 같은 도구)**:
- 서버, admin, 공유 코드를 **한 폴더(저장소)** 안에 둠.
- 폴더 구조로 분리:
  ```
  demo/
  ├── apps/
  │   ├── server/    (NestJS)
  │   ├── admin/     (Angular)
  │   └── ...
  ├── libs/
  │   └── api-client/  (서버↔admin 공유 코드)
  ├── prisma/
  └── docker/
  ```

### 이 프로젝트가 모노레포를 쓰는 이유

1. **타입 자동 공유**: 서버에서 정의한 응답 타입(예: `BoardDTO`)을 admin에서도 똑같이 써야 함. 다른 저장소라면 매번 패키지 배포해야 하지만, 모노레포면 그냥 import.

2. **자동 생성 코드 공유**: ng-openapi-gen이 만든 API 클라이언트 코드는 `libs/api-client/`에 떨어지고, admin이 그걸 바로 import. 별도 배포 절차 불필요.

3. **버전 충돌 없음**: 같은 프로젝트라 모든 dependency 버전이 한 곳에서 관리됨.

4. **한 PR로 전체 변경 가능**: 서버 + admin을 동시에 바꾸는 기능이라면 한 PR에 다 들어감. 검토도 한 번에.

### 비유

여러 부서가 같은 회사 안에 있는 것 vs 각 부서가 다른 회사인 것:
- 모노레포 = 한 회사. 부서 간 협업 빠름.
- 멀티레포 = 자회사 그룹. 부서 간 협업할 때마다 계약 갱신.

소규모 팀에는 모노레포가 거의 항상 유리.

### Nx가 추가로 해주는 것

- **빌드 캐시**: 안 바뀐 부분은 다시 빌드 안 함.
- **affected 명령**: 바뀐 파일과 관련된 것만 테스트/빌드.
- **dependency graph**: 의존 관계를 그래프로 시각화 (`pnpm nx graph`).

---

## 2. 왜 NestJS인가?

### 다른 Node.js 프레임워크와 비교

| 프레임워크 | 특징 |
| --- | --- |
| **Express** | 가장 오래되고 단순. "이거 하세요 저거 하세요" 안 시킴. 자유도 ↑, 구조 일관성 ↓. |
| **Fastify** | Express보다 빠름. 똑같이 미니멀. |
| **Koa** | Express 만든 사람들이 만든 후속작. 비동기 친화. |
| **NestJS** | Angular처럼 "구조"를 강제. DI, 데코레이터, 모듈 시스템. |

### 이 프로젝트가 NestJS를 쓰는 이유

1. **구조가 강제됨**:
   - "이런 건 Controller, 저런 건 Service, DB 접근은 ORM" 같은 규칙이 프레임워크 차원에서 정해짐.
   - 개발자가 100명이라도 모두 같은 구조로 코드를 짜게 됨.
   - Express는 자유도가 높아서 100명이 100가지 스타일로 짜는 경향.

2. **타입 친화**:
   - 처음부터 TypeScript로 설계. 데코레이터, DI 다 타입 안전.
   - 컴파일 단계에서 많은 실수가 잡힘.

3. **데코레이터 기반**:
   - `@Controller`, `@Get`, `@Body` 같은 데코레이터로 코드가 "선언적".
   - "이 함수는 GET /faq 요청을 처리한다"가 한눈에 보임.

4. **DI(의존성 주입) 내장**:
   - Service가 다른 Service에 의존할 때, 그냥 constructor에 적으면 NestJS가 알아서 연결.
   - 테스트 시 mock 주입도 쉬움.

5. **Angular와 디자인 철학이 비슷**:
   - 이 프로젝트는 admin이 Angular라 NestJS와 패턴이 일관됨.
   - `@Component`, `@Module`, `@Injectable`이 양쪽 모두에서 비슷한 의미.
   - 학습 비용 ↓.

### 비유

Express = 일하라 시키지 않는 자유 분위기 회사. 잘하면 좋지만 사람마다 결과물 천차만별.

NestJS = 매뉴얼이 잘 정리된 회사. 누가 와도 일정 수준 이상의 결과물.

큰 프로젝트일수록 NestJS의 일관성이 이득.

### 실제 코드에서 확인

[apps/server/src/app/faq/faq.controller.ts](../apps/server/src/app/faq/faq.controller.ts)와 [apps/server/src/app/event/event.controller.ts](../apps/server/src/app/event/event.controller.ts)를 비교해보세요. 도메인이 달라도 **거의 같은 구조**입니다.

---

## 3. 왜 Prisma인가?

### ORM이란?

ORM(Object-Relational Mapping) = SQL을 직접 안 쓰고 코드로 DB를 다루는 도구.

```typescript
// 직접 SQL
const result = await db.query("SELECT * FROM Admin WHERE email = $1", [email]);

// Prisma
const admin = await prisma.admin.findFirst({ where: { email } });
```

### 다른 ORM과 비교

| ORM | 특징 |
| --- | --- |
| **TypeORM** | Java의 Hibernate 영향. 데코레이터 + Active Record + Repository 패턴. NestJS와 잘 어울리지만 복잡. |
| **Sequelize** | 오래된 JavaScript ORM. 타입 지원 약함. |
| **MikroORM** | TypeORM과 비슷. Unit of Work 패턴. |
| **Drizzle** | 최근 인기. SQL과 가까운 문법. 가벼움. |
| **Prisma** | 별도 스키마 파일(`.prisma`)에서 정의. 타입 자동 생성. 가독성 ↑. |

### 이 프로젝트가 Prisma를 쓰는 이유

1. **스키마와 타입이 자동 동기화**:
   - `.prisma` 파일에 모델 정의 → `prisma generate` 한 번 → TypeScript 타입이 자동 생성.
   - "DB 스키마 바꿨는데 코드에 반영 안 함" 사고를 컴파일 단계에서 잡음.

2. **선언적 마이그레이션**:
   - 스키마 파일에 변경사항 적기만 하면 `prisma migrate dev`가 SQL을 만들어 DB에 반영.
   - 마이그레이션 히스토리도 자동 관리.

3. **읽기 쉬운 쿼리 문법**:
   ```typescript
   await prisma.event.findMany({
       where: { deletedAt: null },
       orderBy: { createdAt: 'desc' },
       skip: 10,
       take: 10,
   });
   ```
   SQL 모르는 사람도 의미를 파악할 수 있음.

4. **타입 안전**:
   - `prisma.admin.create({ data: { invalidField: '...' } })` → 컴파일 에러.
   - 결과 타입도 자동 추론 → admin 객체의 필드 자동완성 지원.

5. **Prisma Studio (GUI)**:
   - `pnpm prisma studio` → 브라우저로 DB GUI. 데이터 조회/수정 쉽게.

### 비유

직접 SQL = 외국어로 직접 편지 쓰기. 빠르고 정확하지만 어려움.

ORM = 번역 앱 사용. 한국어로 적으면 번역해서 보내줌. 익히기 쉽고 실수 적음.

Prisma = 그중에서도 "내 모국어 어휘를 자동완성해주고 오타까지 잡아주는" 똑똑한 번역 앱.

### 실제 코드에서 확인

[prisma/admin.prisma](../prisma/admin.prisma)에서 정의한 모델이 [apps/server/src/app/admin/admin.service.ts](../apps/server/src/app/admin/admin.service.ts)에서 `this.prisma.admin.findFirst({ ... })`로 어떻게 쓰이는지 보세요. **DB 컬럼 이름이 코드에서 그대로 자동완성됨**.

---

## 4. 왜 Angular인가?

### 다른 프론트엔드 프레임워크와 비교

| 프레임워크 | 특징 |
| --- | --- |
| **React** | "라이브러리". 자유도 최고. 라우터/폼/상태관리 모두 별도 선택. |
| **Vue** | React보다 좀 더 가이드라인 있음. 중간 자유도. |
| **Svelte** | 컴파일 타임 변환. 런타임 가벼움. |
| **Angular** | "풀스택 프레임워크". 라우터/폼/HTTP/DI 모두 내장. |

### 이 프로젝트가 Angular를 쓰는 이유

1. **풀스택 프레임워크 = "다 들어있음"**:
   - 라우터, 폼, HTTP, DI, 변화 감지, i18n 등이 모두 공식 라이브러리.
   - 다른 사람 의견에 따라 패키지 갈아끼울 일 없음 → 팀 일관성.

2. **NestJS와 디자인 철학 동일**:
   - 양쪽 다 `@Component`, `@Module`, `@Injectable`, DI 컨테이너 사용.
   - 백엔드 개발자가 프론트 코드 봐도 흐름 이해 가능.

3. **타입 친화**:
   - 처음부터 TypeScript 중심.
   - 폼, 라우터, HTTP 모두 타입 안전.

4. **최신 Angular(17+)의 단순화**:
   - 옛 Angular는 무겁다는 평이 있었지만, 17+ 부터 Standalone Components, Signals, Zoneless 등으로 가벼워짐.
   - 이 프로젝트는 그 최신 기능을 적극 사용.

5. **장기 유지보수에 유리**:
   - Google이 만들고 LTS(장기 지원) 정책. 갑자기 사라질 위험 적음.
   - 6개월마다 메이저 버전이 나오지만 마이그레이션 가이드도 잘 정리됨.

### 비유

React = 부품을 손님이 직접 골라 조립하는 가구점. 자유도 ↑, 시간 ↑.

Angular = 완성품으로 파는 가구점. 빠르게 사용 가능. 다만 "이 모양으로만" 만들어짐.

### 이 프로젝트의 최신 Angular 활용

- **Standalone Components**: NgModule 없이 컴포넌트 단위로 import.
- **Signals**: `signal()`, `computed()`, `input()` — 최신 반응형 상태 관리.
- **Zoneless**: Zone.js 제거. signal 기반 변화 감지.
- **withComponentInputBinding**: URL 파라미터를 input으로 자동 주입.
- **새 control flow**: `@if`, `@for`, `@empty`.

### 실제 코드에서 확인

[apps/admin/src/app/app.config.ts](../apps/admin/src/app/app.config.ts)와 [apps/admin/src/app/stores/admin.store.ts](../apps/admin/src/app/stores/admin.store.ts) 보세요. signal 기반 반응형 패턴이 어떻게 동작하는지.

---

## 5. 왜 ng-openapi-gen인가? (자동 생성 API 클라이언트)

### 문제 상황

서버에서 새 API를 만들면, admin 앱에서도 그 API를 호출하는 코드를 적어야 합니다.

**수동으로 적는 경우**:
```typescript
// admin 앱에서
const res = await fetch('http://localhost:3000/api/faq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, answer })
});
const data = await res.json();
```

문제점:
- URL을 직접 적어야 함 (서버에서 URL 바꾸면 admin도 같이 바꿔야 함).
- 응답 타입을 모름 (`any` 또는 직접 적어야 함).
- 서버 API와 admin 코드가 따로 살아 있어서 동기화 안 됨.

### ng-openapi-gen이 해결

1. 서버가 Swagger(OpenAPI) 스펙을 자동 생성.
2. ng-openapi-gen이 그 스펙을 읽어서 admin용 TypeScript 함수를 자동 생성.

**결과**:
```typescript
const faq = await this.api.invoke(faqControllerCreate, {
    body: { question, answer }
});
// faq의 타입은 자동으로 FaqDto로 추론됨
```

장점:
- URL/HTTP 메서드/파라미터 모두 자동 처리.
- 응답 타입 자동 추론.
- 서버 API 바뀌면 admin 빌드 시 타입 에러로 즉시 발견.

### 이 프로젝트의 자동 생성 흐름

[apps/server/src/main.ts](../apps/server/src/main.ts):
```typescript
generateApiClient(document).then(() => {
    Logger.log('API Client Generated');
});
```

→ 서버 시작 시마다 `libs/api-client/src/lib/`에 클라이언트 코드를 자동 생성.

### 비유

수동 API client = 손으로 발주서 쓰기. 본사가 메뉴 바꾸면 매번 다시 써야 함.

ng-openapi-gen = 본사가 메뉴를 바꾸면 자동으로 새 발주서 양식이 본사 사이트에서 다운로드됨.

### 트레이드오프

- 서버를 매번 재시작해야 admin이 새 함수를 알게 됨.
- 자동 생성 코드라 직접 수정 못함 (다음 생성 때 덮어씌워짐).

---

## 6. 왜 PostgreSQL인가?

### 다른 DB와 비교

| DB | 특징 |
| --- | --- |
| **PostgreSQL** | 오픈소스 관계형 DB. 강력한 기능. JSON 지원. ACID 트랜잭션. |
| **MySQL** | 비슷한 입지. 더 가벼움. |
| **SQLite** | 파일 기반. 단일 사용자나 임베디드용. |
| **MongoDB** | NoSQL(스키마 없음). JSON 문서 저장. |

### 이 프로젝트가 PostgreSQL을 쓰는 이유

1. **Prisma의 잘 지원되는 DB**: PostgreSQL이 가장 안정적으로 지원됨.
2. **JSON 컬럼 + 관계형 둘 다**: 정형 데이터(관리자, FAQ)와 비정형(부가 정보) 둘 다 다룰 수 있음.
3. **트랜잭션**: 여러 작업을 "전부 성공 or 전부 실패"로 묶을 수 있음.
4. **오픈소스 + 무료**: 운영 비용 부담 없음.
5. **풍부한 생태계**: 클라우드 PostgreSQL (Supabase, Neon, AWS RDS) 옵션 많음.

### 비유

DB는 데이터 창고. PostgreSQL은 "잘 관리되는 대형 창고". MongoDB는 "라벨 없는 자유로운 창고". 정형 데이터를 다룰 거라면 PostgreSQL.

---

## 7. 왜 Soft Delete 패턴인가?

### 일반 Delete vs Soft Delete

**일반 Delete**:
```sql
DELETE FROM faq WHERE id = 'abc';
```
- 데이터가 진짜로 사라짐. 복구 불가.

**Soft Delete**:
```sql
UPDATE faq SET deletedAt = NOW() WHERE id = 'abc';
```
- 데이터는 남아있지만 "삭제된 것으로 간주".
- 조회 시 `WHERE deletedAt IS NULL` 조건 추가.

### Soft Delete의 이점

1. **실수 복구 가능**: `deletedAt = NULL`로 되돌리면 부활.
2. **감사 추적**: 언제 누가 삭제했는지 기록 가능.
3. **외래 키 안전**: 다른 테이블이 참조하고 있어도 깨지지 않음.
4. **법적 요구사항**: 일정 기간 데이터 보관이 의무인 경우 대응.

### 단점

1. **모든 쿼리에 조건 추가 필요**: `WHERE deletedAt IS NULL`을 빠뜨리면 삭제된 데이터가 노출됨.
2. **DB 점점 비대해짐**: 주기적인 진짜 삭제(hard delete) 정책 필요할 수 있음.
3. **유니크 제약 신경 써야 함**: 이메일이 unique인데 같은 이메일로 다시 가입 시도하면 충돌. 일반적으로 `email + deletedAt` 조합으로 unique를 잡거나, 삭제 시 이메일을 변형(예: `email_<id>_deleted`)으로 바꾸는 등 처리.

### 이 프로젝트의 적용

[prisma/admin.prisma](../prisma/admin.prisma):
```prisma
deletedAt DateTime?
```

[apps/server/src/app/notice/notice.service.ts](../apps/server/src/app/notice/notice.service.ts) 조회 시:
```typescript
await this.prisma.notice.findMany({
    where: { deletedAt: null },
    ...
});
```

삭제 시 ([apps/server/src/app/faq/faq.service.ts](../apps/server/src/app/faq/faq.service.ts)에서 비슷한 패턴):
```typescript
await this.prisma.faq.update({
    where: { id },
    data: { deletedAt: new Date() },
});
```

### 비유

일반 Delete = 영구 폐기. 한 번 버리면 끝.

Soft Delete = 휴지통으로 이동. 휴지통 비우기 전까진 복구 가능.

운영 환경에서는 거의 항상 Soft Delete가 안전.

---

## 8. 왜 EventEmitter (Pub/Sub) 패턴인가?

### 직접 호출 vs 이벤트

**직접 호출**:
```typescript
async signIn(data) {
    const admin = await this.prisma.admin.findFirst({ ... });
    if (!admin) throw new UnauthorizedException();
    if (!compareSync(password, admin.password)) throw new UnauthorizedException();

    // 부가 작업들
    await this.updateLastLoginAt(admin.id);
    await this.recordLoginLog(admin.id);
    await this.notifySlack(admin.email);

    return admin;
}
```

**이벤트 사용** ([apps/server/src/app/admin/admin.service.ts](../apps/server/src/app/admin/admin.service.ts)):
```typescript
async signIn(data) {
    const admin = await this.prisma.admin.findFirst({ ... });
    if (!admin) throw new UnauthorizedException();
    if (!compareSync(password, admin.password)) throw new UnauthorizedException();

    this.eventEmitter.emit(AdminEvents.ADMIN_LOGGED_IN, { admin });

    return admin;
}
```

이벤트 수신은 [apps/server/src/app/admin/admin.listener.ts](../apps/server/src/app/admin/admin.listener.ts)에서:
```typescript
@OnEvent(AdminEvents.ADMIN_LOGGED_IN)
async handleAdminLoggedInEvent(payload) { ... }
```

### Pub/Sub 패턴의 이점

1. **단일 책임 원칙(SRP)**:
   - `signIn`은 "로그인 검증"만 책임.
   - 로그 기록, 알림 등은 Listener가 별도로 담당.

2. **느슨한 결합(Loose Coupling)**:
   - `signIn`은 "누가 이벤트를 받는지" 몰라도 됨.
   - 나중에 Listener를 추가/제거할 때 `signIn` 코드 안 건드림.

3. **확장성**:
   - 같은 이벤트를 여러 Listener가 동시 수신 가능.
   - 새 알림 채널 추가 시 새 Listener만 만들면 됨.

4. **테스트 용이**:
   - `signIn`을 단위 테스트할 때 부가 작업까지 함께 검증 안 해도 됨.

### 단점

1. **흐름 추적 어려움**: "이 이벤트가 어디로 가는지" 코드 직접 읽어선 안 보임. 검색으로 찾아야 함.
2. **에러 처리 분산**: Listener 에러가 발행자에게 자동 전달 안 됨.

### 언제 쓰고 언제 안 쓰나?

쓰면 좋은 경우:
- 메인 작업과 부가 작업의 책임이 명확히 분리될 때.
- 부가 작업이 여러 개거나 늘어날 가능성이 있을 때.

직접 호출이 나은 경우:
- 부가 작업이 메인 결과에 영향을 줄 때 (예: 트랜잭션 안에서 처리해야).
- 흐름이 명확해야 디버깅 쉬울 때.

### 비유

직접 호출 = 매니저가 직접 모든 부하 직원에게 지시.

Pub/Sub = 매니저가 회의실 화이트보드에 "로그인 발생"이라고 적음. 관심 있는 부서가 알아서 보고 처리.

---

## 9. 왜 Standalone Components (NgModule 없이)?

### 옛 방식 (Angular 13 이하 / NgModule)

```typescript
@NgModule({
    declarations: [SignInPage, FaqPage, ...],
    imports: [CommonModule, FormsModule, ...],
    providers: [...]
})
export class AdminModule {}
```

문제점:
- 컴포넌트 추가할 때마다 NgModule의 `declarations`에 등록 필요.
- 어떤 모듈이 어떤 컴포넌트를 가지는지 추적 어려움.
- 작은 변경에도 NgModule 파일이 자꾸 바뀜.

### 새 방식 (Angular 14+ Standalone)

```typescript
@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in.page.html',
    imports: [CommonModule, ReactiveFormsModule],  // ← 자기가 직접 import
})
export default class SignInPage { ... }
```

- 컴포넌트가 자기 자신의 의존성을 직접 선언.
- NgModule 불필요.
- 새 컴포넌트 추가해도 다른 파일 안 건드림.

### 이 프로젝트의 적용

모든 페이지/컴포넌트가 standalone. [apps/admin/src/main.ts](../apps/admin/src/main.ts):
```typescript
bootstrapApplication(App, appConfig).catch(...);
```
→ NgModule 없이 컴포넌트 + 설정만으로 시작.

### 비유

NgModule = 학교 학년별 명단. 새 학생 올 때마다 명단에 이름 적기.

Standalone = 학생이 자기 명찰 달고 다님. 명단 관리 필요 없음.

후자가 관리 비용 ↓, 학생 추가 빠름.

---

## 10. 왜 Tailwind CSS인가?

### 다른 CSS 방식과 비교

| 방식 | 특징 |
| --- | --- |
| **일반 CSS** | 클래스 직접 정의. 자유롭지만 일관성 떨어지기 쉬움. |
| **SCSS/SASS** | CSS 확장. 변수, 중첩, mixin. |
| **CSS Modules** | 클래스 이름 자동 스코핑. |
| **Styled Components** | CSS-in-JS. 컴포넌트별 스타일. |
| **Tailwind** | 유틸리티 클래스만 조합. "원자" 단위로 스타일링. |

### 이 프로젝트가 Tailwind를 쓰는 이유 (추정)

1. **속도**: `class="text-base text-on-surface-variant"` 한 줄로 끝. 별도 CSS 파일 안 만듦.
2. **일관성**: 디자인 시스템 토큰(예: `text-on-surface-variant`)을 강제. 일관된 색상/간격.
3. **사용 안 한 CSS 제거**: Tailwind는 빌드 시 사용된 클래스만 포함. 번들 크기 ↓.
4. **HTML만 봐도 스타일 파악**: 별도 CSS 파일 안 봐도 어떻게 보일지 짐작 가능.

### 단점

- HTML이 클래스로 도배되어 길어 보임.
- 디자인 토큰을 외워야 함 (`p-4`가 어느 정도 padding인지).

### 실제 코드에서 확인

[apps/admin/src/app/components/page-header/page-header.component.html](../apps/admin/src/app/components/page-header/page-header.component.html) 참고. Tailwind 클래스만으로 스타일.

---

## 11. 왜 Reactive Forms (Forms Module)인가?

### Angular 폼 두 가지 방식

**Template-driven Forms (HTML 위주)**:
```html
<input [(ngModel)]="user.name" required />
```
- 단순. 빠른 프로토타입.
- 검증/제어 로직이 HTML에 산재.

**Reactive Forms (TypeScript 위주)**:
```typescript
form = new FormGroup({
    name: new FormControl('', [Validators.required])
});
```
- 폼 상태/검증을 코드로 다룸.
- 복잡한 검증, 동적 폼에 유리.
- 테스트 쉬움.

### 이 프로젝트가 Reactive를 쓰는 이유

1. **복잡한 검증 규칙**:
   - 비밀번호: 길이 8~16 + 영문/숫자/특수문자 조합 (정규식).
   - 이메일 형식 검사.
   - 이런 건 Template-driven으로 표현하기 어려움.

2. **에러 메시지 표시 제어**:
   - `form.errors`로 어떤 검증이 실패했는지 코드로 확인 가능.

3. **타입 안전**:
   - `nonNullable: true`로 null 없는 타입 보장.
   - `form.getRawValue()`로 모든 값 타입 자동 추론.

### 실제 코드에서 확인

[apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts](../apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts):
```typescript
form = new FormGroup({
    email: new FormControl('', {
        validators: [Validators.required, Validators.email],
        nonNullable: true,
    }),
    password: new FormControl('', {
        validators: [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(16),
            Validators.pattern(/.../),
        ],
        nonNullable: true,
    }),
});
```

---

## 12. 왜 ChangeDetectorRef.markForCheck()를 호출하나?

### Zoneless 환경

이 프로젝트는 [app.config.ts](../apps/admin/src/app/app.config.ts)에서 `provideZonelessChangeDetection()`를 사용.

→ Zone.js를 안 쓴다는 뜻. signal 기반 자동 갱신만 작동.

### 문제

```typescript
async loadData() {
    this.events = await this.api.invoke(...);
    // events가 signal이 아닌 일반 배열 → Angular가 변화 감지 못 함 → 화면 갱신 안 됨
}
```

### 해결

```typescript
async loadData() {
    this.events = await this.api.invoke(...);
    this.cdr.markForCheck();  // ← 명시적으로 "다시 그리세요"
}
```

`cdr` = `inject(ChangeDetectorRef)`.

### 왜 그냥 signal로 안 하나?

`events`를 `signal<EventDto[]>([])`로 만들면 markForCheck 호출 없이 자동 갱신.

→ 사실 그게 더 정석. 이 프로젝트는 일부 일반 속성 + markForCheck 패턴도 섞여 있는데, 점진적으로 signal로 마이그레이션해도 OK.

### 비유

Zone.js 사용 시 = 자동 알림. 무엇이 바뀌든 알아서 알려줌.

Zoneless = 직접 알림. signal로 만들거나 markForCheck로 명시적으로 알려야 함. 가볍지만 신경 써야 함.

---

## 13. 왜 Docker (PostgreSQL만)인가?

### 문제 없이 DB 띄우기

DB를 OS에 직접 설치하면:
- 버전 충돌
- 설정 파일 위치 다 다름
- 다른 프로젝트의 PostgreSQL과 포트 충돌
- 팀원마다 환경 다름

### Docker로 해결

[docker/docker-compose.yml](../docker/docker-compose.yml):
```yaml
services:
  database:
    image: postgres:18-alpine
    container_name: demo-db
    environment:
      POSTGRES_USER: demouser
      POSTGRES_PASSWORD: qwerasdf1234
      POSTGRES_DB: demodb
    volumes:
      - demo_database_volume:/data
    ports:
      - "5432:5432"
```

명령 한 줄로 시작:
```bash
docker-compose up -d
```

장점:
- **재현성**: 누가 어떤 OS에서 돌리든 똑같은 DB 환경.
- **격리**: 컨테이너 안에서 동작. 호스트 OS 안 더럽힘.
- **삭제 쉬움**: `docker-compose down` 한 줄.
- **버전 명시**: `postgres:18-alpine`으로 정확한 버전.

### 왜 서버/admin은 Docker 안 쓰나?

- 개발 중에는 빠른 핫리로드가 필요해서 로컬 실행이 편함.
- 운영 배포 시에는 보통 서버/admin도 Docker화하지만, 개발 환경에선 DB만 Docker로도 충분.

### 비유

직접 설치 = 매번 호텔에서 가구 들여놓기.

Docker = 가구 완비된 에어비앤비. 체크인하면 바로 사용 가능, 체크아웃하면 깨끗히 정리.

---

## 14. 폴더 구조의 의미

### 큰 그림

```
demo/
├── apps/              ← 실행 가능한 앱들
│   ├── server/        ← NestJS API 서버
│   ├── admin/         ← Angular 관리자 화면
│   ├── shop/          ← (Angular SSR 쇼핑몰 — 이번 학습 범위 밖)
│   └── api/           ← (별도 작업물)
├── libs/              ← 여러 앱이 공유하는 라이브러리
│   └── api-client/    ← ng-openapi-gen이 자동 생성
├── prisma/            ← DB 스키마 (모든 도메인의 .prisma 파일)
├── docker/            ← 인프라 정의
└── docs/              ← 학습 문서 (이 폴더)
```

### 왜 이 구조?

- **apps와 libs 분리**: 실행되는 것 vs 가져다 쓰는 것.
- **prisma 폴더 별도**: DB 스키마는 한 곳에서 관리 (apps/server 안에 두지 않은 이유 — 다른 앱도 prisma 사용 가능).
- **docker 폴더 별도**: 인프라 설정은 한 곳에.
- **Nx 관례 따름**: Nx 모노레포의 표준 구조.

---

## 15. 정리 — 이 프로젝트의 설계 철학 한 줄 요약

> **"구조 강제 + 타입 안전 + 자동화"**

- **구조 강제**: NestJS / Angular의 데코레이터 + 모듈 패턴이 강제하는 일관된 구조.
- **타입 안전**: Prisma 자동 타입 + DTO + ng-openapi-gen 자동 클라이언트. 컴파일 단계에서 많은 실수 차단.
- **자동화**: API 클라이언트 자동 생성, 마이그레이션 자동 SQL, 모듈 자동 의존성 주입. 손으로 적는 코드 최소화.

이 세 가지 기둥을 한 마디로 줄이면: **"실수가 적고 일관된 코드를 빠르게 쓰자"**.

---

## 의문점이 생기면

코드를 보다가 "왜 이렇게 했지?"라는 의문이 들면, 위 14가지 항목 중 어디에 해당하는지 매핑해보세요. 거의 다 여기 답이 있습니다.

여기에 답이 없다면 답을 찾을 가치가 있는 좋은 질문이에요. 그럴 땐 [LEARNING_GUIDE.md](../LEARNING_GUIDE.md)에서 함수/개념을 확인하거나, [01-flow-walkthrough.md](01-flow-walkthrough.md)에서 흐름을 따라가보세요.
