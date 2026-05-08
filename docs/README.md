# 프로젝트 학습 가이드

이 문서 모음은 이 프로젝트의 구조와 기술들을 처음 접하는 사람도 이해할 수 있도록 아주 자세하게 정리한 학습 가이드입니다.

> **어떻게 공부해야 할지 막막하다면 → [LEARNING-GUIDE.md](./LEARNING-GUIDE.md) 먼저 읽기**

---

## 폴더 구조

```text
docs/
├── README.md           ← 지금 읽고 있는 파일 (전체 목차)
│
├── nx/                 ← Nx 워크스페이스 관련
│   ├── 01-nx-json.md          Nx의 두뇌 — 빌드/캐시/플러그인 설정
│   ├── 02-tsconfig-base.md    TypeScript 설정 — 프로젝트 간 코드 공유
│   ├── 03-project-json.md     각 앱의 타겟(작업) 설정
│   └── 04-package-json.md     전체 의존성과 스크립트
│
├── nestjs/             ← NestJS 서버 관련
│   ├── 01-main-ts.md          서버 시작점 — 앱 부트스트랩
│   ├── 02-modules.md          모듈 시스템 — AppModule, AdminModule, PrismaModule
│   ├── 03-service-controller.md  비즈니스 로직과 HTTP 라우팅
│   ├── 04-dto-pattern.md      데이터 검증과 직렬화 패턴
│   ├── 05-prisma.md           데이터베이스 연결과 스키마 정의
│   ├── 06-prisma-queries.md   Prisma 쿼리 함수 완전 정복
│   ├── 07-prisma-relations.md Prisma 관계(1:1, 1:N, N:M) 정의와 쿼리
│   └── 08-prisma-errors.md    Prisma 에러 처리 패턴
│
├── angular/            ← Angular 어드민 앱 관련
│   ├── 01-bootstrap.md        앱 진입점 — 앱 시작 방법
│   ├── 02-routing.md          페이지 라우팅
│   ├── 03-signals-store.md    Signal 기반 상태관리
│   └── 04-api-client.md       자동 생성 API 클라이언트
│
└── typescript/         ← TypeScript 핵심 개념
    ├── 01-basic-types.md        기본 타입 — string, number, boolean 등
    ├── 02-type-vs-interface.md  type vs interface — 언제 무엇을?
    ├── 03-union-types.md        유니온 타입 — "이것 또는 저것"
    ├── 04-optional-assertion.md ?, ?., ??, ! 연산자
    ├── 05-generics.md           제네릭 — 타입도 매개변수로
    ├── 06-utility-types.md      유틸리티 타입 — Partial, Omit, Pick 등
    ├── 07-type-guard.md         타입 가드 — 타입 좁히기
    ├── 08-class-access.md       클래스 접근 제한자 — public, private 등
    ├── 09-enum.md               열거형 — 정해진 값들의 모음
    ├── 10-decorators.md         데코레이터 — @Injectable, @Get 등
    ├── 11-type-assertion.md     타입 단언 — as, as const
    ├── 12-intersection-types.md 교차 타입 — "이것도 저것도"
    └── 13-type-inference.md     타입 추론 — TypeScript가 알아서 파악
```

---

## 공부 순서

### 1단계 — Nx 워크스페이스 이해 (전체 구조 파악)

1. [nx.json — Nx의 두뇌](./nx/01-nx-json.md)
2. [tsconfig.base.json — 코드 공유의 핵심](./nx/02-tsconfig-base.md)
3. [project.json — 각 앱의 작업 설정](./nx/03-project-json.md)
4. [package.json — 의존성과 스크립트](./nx/04-package-json.md)

### 2단계 — NestJS 서버 이해

1. [main.ts — 서버 시작점](./nestjs/01-main-ts.md)
2. [모듈 시스템](./nestjs/02-modules.md)
3. [서비스와 컨트롤러](./nestjs/03-service-controller.md)
4. [DTO 패턴](./nestjs/04-dto-pattern.md)
5. [Prisma — 데이터베이스](./nestjs/05-prisma.md)
6. [Prisma 쿼리 함수](./nestjs/06-prisma-queries.md)
7. [Prisma 관계](./nestjs/07-prisma-relations.md)
8. [Prisma 에러 처리](./nestjs/08-prisma-errors.md)

### 3단계 — Angular 어드민 앱 이해

1. [앱 시작점](./angular/01-bootstrap.md)
2. [라우팅](./angular/02-routing.md)
3. [Signal 상태관리](./angular/03-signals-store.md)
4. [API 클라이언트](./angular/04-api-client.md)

### 4단계 — TypeScript 핵심 개념

1. [기본 타입](./typescript/01-basic-types.md)
2. [type vs interface](./typescript/02-type-vs-interface.md)
3. [유니온 타입](./typescript/03-union-types.md)
4. [옵셔널과 단언 연산자](./typescript/04-optional-assertion.md)
5. [제네릭](./typescript/05-generics.md)
6. [유틸리티 타입](./typescript/06-utility-types.md)
7. [타입 가드](./typescript/07-type-guard.md)
8. [클래스와 접근 제한자](./typescript/08-class-access.md)
9. [열거형(Enum)](./typescript/09-enum.md)
10. [데코레이터](./typescript/10-decorators.md)
11. [타입 단언](./typescript/11-type-assertion.md)
12. [교차 타입](./typescript/12-intersection-types.md)
13. [타입 추론](./typescript/13-type-inference.md)

---

## 이 프로젝트의 전체 흐름

```text
[사용자] 브라우저에서 로그인 시도
    ↓
[Angular] 폼 데이터를 API 클라이언트로 전송
    ↓
[api-client] @hey-api/openapi-ts가 자동 생성한 fetch 함수 호출
    ↓
[NestJS] POST /api/admins/signin 엔드포인트 수신
    ↓
[NestJS] DTO로 유효성 검사 → Service에서 DB 조회 → 비밀번호 비교
    ↓
[Prisma] PostgreSQL 데이터베이스에서 관리자 정보 조회
    ↓
[NestJS] 응답 반환 (AdminDTO로 직렬화 — 비밀번호 제외)
    ↓
[Angular] AdminStore에 사용자 정보 저장 → 대시보드로 이동
```
