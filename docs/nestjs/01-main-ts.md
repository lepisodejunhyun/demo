# main.ts — 서버의 시작점

**파일 위치:** `apps/server/src/main.ts`

---

## 이 파일이 왜 필요한가?

모든 프로그램에는 시작점이 있어요. 책의 첫 페이지처럼요. NestJS 서버도 마찬가지예요.

`pnpm nx serve server` 명령을 치면 Node.js가 맨 먼저 이 파일을 실행해요. 이 파일에서 서버 전체 설정이 완료되고, 포트를 열어서 HTTP 요청을 받을 준비를 마쳐요.

---

## 실제 코드 전체

```typescript
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Swagger Document')
      .build(),
    {}
  );

  SwaggerModule.setup('api-docs', app, document);

  app.use(
    '/reference',
    apiReference({
      spec: { content: document },
    })
  );

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
```

---

## 코드 단계별 분석

### 1단계: 앱 생성

```typescript
const app = await NestFactory.create(AppModule);
```

`NestFactory.create()` — NestJS 앱 인스턴스를 생성해요.

마치 식당을 열기 전에 "오늘 영업 준비!"를 선언하는 것처럼, 서버 전체를 초기화하는 과정이에요.

`AppModule`은 서버 전체 설정의 최상위 모듈이에요. 여기서 어떤 기능들을 쓸지 모두 등록해 두었어요.

`await`를 쓰는 이유: 앱 생성이 비동기 작업이거든요. 데이터베이스 연결, 모듈 초기화 등 시간이 걸리는 작업들이 완료될 때까지 기다려야 해요.

---

### 2단계: 전역 URL 접두사 설정

```typescript
const globalPrefix = 'api';
app.setGlobalPrefix(globalPrefix);
```

모든 API URL 앞에 `/api`를 자동으로 붙여줘요.

```
설정 전:  GET /admins
설정 후:  GET /api/admins   ← 자동으로 /api 추가
```

왜 이렇게 하냐면:
```
http://localhost:3000/api/admins   → NestJS가 처리
http://localhost:3000/assets/...   → 정적 파일 서버가 처리
```

같은 서버에서 API와 정적 파일을 함께 제공할 때 구분하기 위해서예요.

---

### 3단계: 포트 설정

```typescript
const port = process.env.PORT || 3000;
```

`process.env.PORT` — 환경 변수에서 포트 번호를 가져와요.

```
환경 변수 PORT가 설정되어 있으면 → 그 포트 사용
설정 안 되어 있으면 → 기본값 3000 사용
```

왜 환경 변수를 쓰냐면:
- 개발 환경: 3000포트
- 배포 환경(AWS, GCP 등): 8080포트 (또는 다른 포트)

코드를 수정하지 않고 환경에 따라 포트를 바꿀 수 있어요.

---

### 4단계: Swagger 문서 생성

```typescript
const document = SwaggerModule.createDocument(
  app,
  new DocumentBuilder()
    .setTitle('Swagger Document')
    .build(),
  {}
);

SwaggerModule.setup('api-docs', app, document);
```

**Swagger란?**

API 명세서예요. 어떤 URL이 있고, 어떤 데이터를 주고받는지 문서화한 것이에요.

`DocumentBuilder` — 문서의 기본 정보 설정:
```
.setTitle('Swagger Document')  → 문서 제목
.build()                       → 설정 완료, 생성
```

`SwaggerModule.setup('api-docs', app, document)` — 문서를 URL에 등록:

```
http://localhost:3000/api-docs      → JSON 형태의 API 스펙 (api-docs-json)
```

이 JSON을 `pnpm generate:api` 명령에서 읽어서 TypeScript 코드를 자동 생성해요!

---

### 5단계: Scalar UI 등록

```typescript
app.use(
  '/reference',
  apiReference({
    spec: { content: document },
  })
);
```

`@scalar/nestjs-api-reference` — 예쁜 API 문서 UI예요.

```
http://localhost:3000/reference
```

이 URL에 접속하면 아름다운 인터랙티브 API 문서를 볼 수 있어요. API를 직접 테스트해볼 수도 있어요.

**Swagger UI vs Scalar UI 차이:**

```
SwaggerModule.setup  → JSON 스펙 + 기본 Swagger UI
Scalar (/reference)  → 더 예쁘고 사용하기 편한 UI
```

둘 다 같은 API 스펙을 보여주지만 Scalar가 디자인이 더 좋아요.

---

### 6단계: ValidationPipe 전역 설정 ⭐

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

이게 아주 중요한 보안 설정이에요!

**ValidationPipe가 하는 일:**

클라이언트(브라우저)가 서버에 데이터를 보낼 때, 그 데이터가 올바른지 자동으로 검사해줘요.

```
클라이언트가 보낸 데이터:
{
  "email": "test@example.com",
  "password": "abc123!@#"
}

DTO에 @IsEmail(), @MinLength(8) 데코레이터가 있으면:
  email → 이메일 형식인지 자동 검사
  password → 8자 이상인지 자동 검사
```

---

**`whitelist: true`**

DTO에 정의되지 않은 필드는 자동으로 제거해요.

```typescript
// AdminSignInDTO에는 email, password만 있어요
class AdminSignInDTO {
  email: string;
  password: string;
}
```

```
클라이언트가 이렇게 보내도:
{
  "email": "test@test.com",
  "password": "abc123!@#",
  "isAdmin": true,       ← DTO에 없는 필드
  "hackField": "danger"  ← 악성 필드
}

whitelist: true 덕분에:
{
  "email": "test@test.com",
  "password": "abc123!@#"
}
← 정의된 필드만 남기고 나머지는 자동 제거!
```

**`forbidNonWhitelisted: true`**

`whitelist`는 그냥 제거하는데, `forbidNonWhitelisted`는 **에러를 반환**해요.

```
클라이언트가 DTO에 없는 필드를 보내면:
  whitelist만 있을 때 → 그냥 제거하고 계속 처리
  forbidNonWhitelisted도 있을 때 → 400 에러 반환 (처리 거부)
```

**`transform: true`**

클라이언트가 보낸 문자열을 자동으로 적절한 타입으로 변환해요.

```
URL 파라미터는 기본적으로 문자열이에요:
  GET /api/admins/1  → "1" (문자열)

transform: true 덕분에:
  DTO에 id: number 로 되어있으면
  → 자동으로 숫자로 변환: 1 (number)
```

**전역(`useGlobalPipes`)으로 설정하는 이유:**

모든 엔드포인트에 일일이 `@UsePipes(ValidationPipe)`를 붙이지 않아도 자동으로 적용돼요.

---

### 7단계: 서버 시작

```typescript
await app.listen(port);
Logger.log(
  `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
);
```

`app.listen(port)` — 지정된 포트에서 HTTP 요청을 받기 시작해요.

```
서버 시작 완료!
🚀 Application is running on: http://localhost:3000/api
```

---

### `bootstrap()` 함수와 마지막 줄

```typescript
async function bootstrap() {
  // ... 서버 설정 전체
}

bootstrap();  // ← 맨 마지막에 실행
```

왜 함수로 감쌌냐면: `await`는 `async function` 안에서만 쓸 수 있어요. 그래서 모든 코드를 `async function bootstrap()`으로 감싸고, 마지막 줄에서 그 함수를 호출하는 패턴을 써요.

---

## 전체 흐름 요약

```
bootstrap() 함수 실행
  │
  ├── 1. NestFactory.create(AppModule)
  │      → 앱 초기화 (DB 연결, 모듈 로딩 등)
  │
  ├── 2. setGlobalPrefix('api')
  │      → 모든 URL에 /api 접두사
  │
  ├── 3. Swagger 문서 생성
  │      → /api-docs-json (JSON 스펙)
  │
  ├── 4. Scalar UI 등록
  │      → /reference (예쁜 API 문서 UI)
  │
  ├── 5. ValidationPipe 전역 설정
  │      → 모든 요청의 데이터 자동 검증
  │
  └── 6. app.listen(3000)
         → HTTP 요청 받기 시작!
```

**핵심을 한 줄로:** `main.ts`는 서버가 시작될 때 딱 한 번 실행되며, 전체 서버의 설정을 완료하고 요청을 받을 준비를 해요.
