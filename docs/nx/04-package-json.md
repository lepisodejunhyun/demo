# package.json — 전체 의존성과 스크립트

**파일 위치:** `package.json` (프로젝트 루트)

---

## 이 파일이 왜 필요한가?

`package.json`은 Node.js 프로젝트의 **신분증이자 쇼핑 목록**이에요.

- 프로젝트 이름, 버전 등 기본 정보
- 이 프로젝트가 사용하는 외부 라이브러리 목록 (의존성)
- 자주 쓰는 명령어 단축키 (스크립트)

---

## 실제 코드 (주요 부분)

```json
{
  "name": "@org/source",
  "version": "0.0.0",
  "license": "MIT",
  "scripts": {
    "generate:api": "openapi-ts --input http://localhost:3000/api-docs-json --output libs/api-client/src"
  },
  "private": true,
  "dependencies": { ... },
  "devDependencies": { ... }
}
```

---

## 1. 기본 정보

```json
"name": "@org/source",
"version": "0.0.0",
"license": "MIT",
"private": true
```

**`name: "@org/source"`** — 프로젝트 이름

`@org/` 는 스코프(scope)예요. 보통 회사명이나 조직명을 써요. 이 프로젝트는 샘플이라 `@org`로 되어있어요.

**`private: true`** — npm에 공개 배포하지 않겠다는 선언

모노레포 루트 `package.json`에는 보통 이 설정을 넣어요. 실수로 배포되는 걸 방지해요.

---

## 2. `scripts` — 명령어 단축키

```json
"scripts": {
  "generate:api": "openapi-ts --input http://localhost:3000/api-docs-json --output libs/api-client/src"
}
```

이 프로젝트에는 스크립트가 딱 하나 있어요.

**`generate:api`**

```bash
pnpm generate:api
# 실제 실행:
# openapi-ts --input http://localhost:3000/api-docs-json --output libs/api-client/src
```

이 명령은:
1. 서버(`http://localhost:3000`)에서 Swagger 스펙(API 명세서 JSON)을 가져와요
2. 그걸 바탕으로 TypeScript 코드를 자동 생성해서
3. `libs/api-client/src/` 폴더에 저장해요

생성되는 파일들:
```
libs/api-client/src/
├── client.gen.ts   ← HTTP 클라이언트 인스턴스
├── sdk.gen.ts      ← API 함수들 (adminControllerSignin 등)
├── types.gen.ts    ← 타입 정의들 (AdminDto, AdminSignInDto 등)
└── index.ts        ← 위 파일들을 모아서 export
```

**언제 쓰냐?**

서버에 새 API 엔드포인트를 추가했을 때:
```
1. server에 새 엔드포인트 코드 작성
2. pnpm nx serve server (서버 실행)
3. pnpm generate:api (새 API 코드 자동 생성)
4. admin 앱에서 새로 생성된 함수 바로 사용 가능
```

---

## 3. `dependencies` — 앱 실행에 필요한 라이브러리

```json
"dependencies": {
  "@angular/core": "21.2.9",
  "@nestjs/common": "^11.0.0",
  "@prisma/client": "^7.8.0",
  ...
}
```

앱이 **실제 실행될 때** 필요한 라이브러리들이에요.

### Angular 관련

```json
"@angular/core": "21.2.9",
"@angular/common": "21.2.9",
"@angular/forms": "21.2.9",
"@angular/router": "21.2.9",
"@angular/platform-browser": "21.2.9"
```

Angular 프레임워크 핵심 패키지들이에요. 버전이 전부 `21.2.x`로 맞춰져 있어요 (Angular는 패키지들 버전을 동일하게 맞추는 게 중요해요).

```
@angular/core     → Angular의 가장 기본 (Component, Injectable 등)
@angular/common   → ngIf, ngFor 등 기본 디렉티브
@angular/forms    → 폼 처리 (ReactiveFormsModule 등)
@angular/router   → 페이지 라우팅
```

### NestJS 관련

```json
"@nestjs/common": "^11.0.0",
"@nestjs/core": "^11.0.0",
"@nestjs/platform-express": "^11.0.0",
"@nestjs/swagger": "^11.4.2",
"@nestjs/event-emitter": "^3.1.0"
```

```
@nestjs/common        → Controller, Injectable, Get, Post 등 핵심 데코레이터
@nestjs/core          → NestJS 앱 생성 (NestFactory)
@nestjs/platform-express → Express.js 기반 HTTP 서버
@nestjs/swagger       → Swagger API 문서 자동 생성
@nestjs/event-emitter → 이벤트 발행/구독 (로그인 이벤트 등)
```

### Prisma 관련

```json
"@prisma/client": "^7.8.0",
"@prisma/adapter-pg": "^7.8.0",
"prisma": "^7.8.0",
"pg": "^8.20.0"
```

```
prisma          → Prisma CLI (prisma generate, prisma migrate 명령)
@prisma/client  → 실제 DB 쿼리할 때 쓰는 클라이언트 (prisma.admin.findMany 등)
@prisma/adapter-pg → PostgreSQL 연결용 어댑터
pg              → PostgreSQL 드라이버 (Node.js에서 PostgreSQL 연결)
```

### 유틸리티

```json
"bcryptjs": "^3.0.3",
"class-transformer": "^0.5.1",
"class-validator": "^0.15.1",
"rxjs": "~7.8.0",
"zone.js": "0.16.0"
```

```
bcryptjs          → 비밀번호 암호화/비교 (로그인 기능)
class-transformer → 객체 변환 (AdminDTO 직렬화/역직렬화)
class-validator   → 유효성 검사 (@IsEmail, @MinLength 등)
rxjs              → 반응형 프로그래밍 (Observable, Subject 등)
zone.js           → Angular의 변경 감지 시스템 (Angular 필수)
```

---

## 4. `devDependencies` — 개발할 때만 필요한 라이브러리

```json
"devDependencies": {
  "@hey-api/openapi-ts": "0.97.1",
  "@nx/angular": "22.7.0",
  "@nx/nest": "^22.7.1",
  "typescript": "~5.9.2",
  ...
}
```

빌드, 테스트, 코드 생성 등 **개발 과정에서만** 쓰이는 도구들이에요. 실제 배포된 앱에는 포함되지 않아요.

### API 클라이언트 자동 생성

```json
"@hey-api/openapi-ts": "0.97.1"
```

`pnpm generate:api` 명령에서 사용하는 도구예요. Swagger 스펙 → TypeScript 코드 자동 변환.

### Nx 플러그인들

```json
"@nx/angular": "22.7.0",
"@nx/nest": "^22.7.1",
"@nx/webpack": "22.7.0",
"@nx/eslint": "22.7.0",
"@nx/vite": "22.7.0",
"@nx/vitest": "22.7.0",
"@nx/playwright": "22.7.0",
"@nx/js": "22.7.1",
"@nx/node": "22.7.1",
"@nx/web": "22.7.0",
"@nx/workspace": "22.7.0"
```

`nx.json`의 `plugins`에서 사용하는 Nx 플러그인들이에요.
전부 `22.7.x` 버전으로 맞춰져 있어요 (Nx도 플러그인 버전을 맞추는 게 중요해요).

### TypeScript

```json
"typescript": "~5.9.2"
```

TypeScript 컴파일러예요. `~5.9.2`는 `5.9.2` 이상 `5.10.0` 미만을 의미해요.

`~` (틸드) vs `^` (캐럿):
```
~5.9.2  → 패치 버전만 올라가도 됨: 5.9.2, 5.9.3, 5.9.4 ...
^11.0.0 → 마이너 버전까지 올라가도 됨: 11.0.0, 11.1.0, 11.2.0 ...
0.97.1  → 버전 고정 (정확히 이 버전만)
```

### 테스트 도구

```json
"vitest": "4.0.9",
"@vitest/ui": "4.0.9",
"@vitest/coverage-v8": "4.0.9",
"@analogjs/vitest-angular": "2.2.0",
"@playwright/test": "^1.36.0"
```

```
vitest           → 단위 테스트 프레임워크 (Jest 대체)
@vitest/ui       → 테스트 결과를 브라우저에서 시각적으로 확인
vitest/coverage  → 코드 커버리지 측정
vitest-angular   → Angular 컴포넌트 테스트용 어댑터
@playwright/test → E2E(통합) 테스트 프레임워크
```

### 빌드 도구

```json
"esbuild": "^0.27.0",
"webpack-cli": "^5.1.4",
"@swc-node/register": "1.11.1",
"@swc/core": "1.15.8"
```

```
esbuild       → 매우 빠른 JS 번들러/트랜스파일러
webpack-cli   → Webpack 커맨드라인 도구 (server 빌드에 사용)
@swc/core     → Rust 기반 고속 TypeScript 컴파일러 (vitest에서 사용)
```

---

## 5. 버전 관리 방식 이해

```
"21.2.9"    → 버전 고정 (정확히 이 버전)
"~5.9.2"    → 패치만 허용 (5.9.x)
"^11.0.0"   → 마이너까지 허용 (11.x.x)
"^0.97.1"   → 0.x에서는 패치만 허용 (특수 규칙)
```

`^` 와 `~` 를 쓰는 이유: 버그 수정(패치) 업데이트는 자동으로 받고 싶기 때문이에요.

단, `0.x.x` 버전(아직 정식 출시 전)은 마이너 버전도 큰 변화가 있을 수 있어서 더 조심해요.

---

## 전체 요약

```
package.json
  │
  ├── scripts
  │   └── generate:api  → Swagger → TypeScript 코드 자동 생성
  │
  ├── dependencies       → 실제 앱 실행에 필요한 라이브러리
  │   ├── Angular 패키지 (프론트엔드)
  │   ├── NestJS 패키지 (백엔드)
  │   ├── Prisma 패키지 (데이터베이스)
  │   └── 유틸리티 (bcrypt, class-validator 등)
  │
  └── devDependencies    → 개발/빌드 도구
      ├── Nx 플러그인들
      ├── TypeScript 컴파일러
      ├── 테스트 도구 (vitest, playwright)
      └── 빌드 도구 (webpack, esbuild)
```
