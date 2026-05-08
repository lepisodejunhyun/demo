# project.json — 각 앱의 작업 설정

**파일 위치:**
- `apps/admin/project.json` (Angular 어드민 앱)
- `apps/server/project.json` (NestJS 서버 앱)

---

## 이 파일이 왜 필요한가?

`nx.json`이 워크스페이스 전체의 공통 규칙을 정의한다면, `project.json`은 **각 프로젝트 고유의 작업(타겟) 설정**을 담아요.

예를 들어:
- admin 앱은 Angular로 빌드하므로 Angular 전용 빌드 설정이 필요
- server 앱은 NestJS(Node.js)로 빌드하므로 Webpack 빌드 설정이 필요

---

## admin/project.json 분석

```json
{
  "name": "admin",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "prefix": "app",
  "sourceRoot": "apps/admin/src",
  "tags": [],
  "targets": { ... }
}
```

### 기본 정보

| 필드 | 값 | 설명 |
|------|-----|------|
| `name` | `"admin"` | 프로젝트 이름. `pnpm nx build admin` 처럼 이 이름으로 명령 실행 |
| `projectType` | `"application"` | 실행 가능한 앱 (library면 라이브러리) |
| `prefix` | `"app"` | Angular 컴포넌트 선택자 접두사. `app-sign-in` 같은 형태 |
| `sourceRoot` | `"apps/admin/src"` | 소스 코드가 있는 폴더 |
| `tags` | `[]` | 프로젝트에 태그 붙이기 (지금은 비어있음) |

---

### `build` 타겟

```json
"build": {
  "executor": "@angular/build:application",
  "outputs": ["{options.outputPath}"],
  "options": {
    "outputPath": "dist/apps/admin",
    "browser": "apps/admin/src/main.ts",
    "tsConfig": "apps/admin/tsconfig.app.json",
    "assets": [
      { "glob": "**/*", "input": "apps/admin/public" }
    ],
    "styles": ["apps/admin/src/styles.css"]
  },
  ...
}
```

**`executor`** — 이 작업을 어떤 도구로 실행할지

`@angular/build:application` = Angular 공식 빌드 도구 사용

**`outputs`** — 빌드 결과물이 저장될 위치

`dist/apps/admin/` 폴더에 HTML, JS, CSS 파일이 생성돼요.

**`options`** — 빌드 설정

- `outputPath: "dist/apps/admin"` → 빌드된 파일이 저장될 폴더
- `browser: "apps/admin/src/main.ts"` → 앱의 시작 파일 (진입점)
- `tsConfig: "apps/admin/tsconfig.app.json"` → 빌드할 때 쓸 TypeScript 설정
- `assets` → 이미지, 폰트 등 정적 파일이 있는 폴더 (`public/`)
- `styles: ["apps/admin/src/styles.css"]` → 전역 CSS 파일

---

### `build` 환경별 설정 (`configurations`)

```json
"configurations": {
  "production": {
    "budgets": [
      {
        "type": "initial",
        "maximumWarning": "500kb",
        "maximumError": "1mb"
      },
      {
        "type": "anyComponentStyle",
        "maximumWarning": "4kb",
        "maximumError": "8kb"
      }
    ],
    "outputHashing": "all"
  },
  "development": {
    "optimization": false,
    "extractLicenses": false,
    "sourceMap": true
  }
},
"defaultConfiguration": "production"
```

**`production` 설정**

`budgets` — 파일 크기 제한이에요.

```
앱 번들 파일 크기가:
  500kb 넘으면 → 경고 (빌드는 됨)
  1mb 넘으면 → 에러 (빌드 실패)

컴포넌트 CSS가:
  4kb 넘으면 → 경고
  8kb 넘으면 → 에러
```

파일이 너무 커지면 로딩 속도가 느려지니까 이 제한을 두는 거예요.

`outputHashing: "all"` — 파일 이름에 해시 값을 붙여요.

```
빌드 전:  main.js
빌드 후:  main.a1b2c3d4.js  (코드가 바뀔 때마다 해시가 달라짐)
```

이렇게 하면 사용자 브라우저가 "새 버전이 나왔구나, 다시 다운로드해야겠다"를 자동으로 알아챠요 (캐시 문제 해결).

**`development` 설정**

- `optimization: false` → 코드 압축 안 함 (디버깅하기 쉽게)
- `sourceMap: true` → 소스맵 생성 (개발자 도구에서 TS 코드로 디버깅)

**`defaultConfiguration: "production"`**

`pnpm nx build admin`만 치면 기본으로 production 설정으로 빌드해요.

개발할 때는:
```bash
pnpm nx build admin --configuration=development
# 또는
pnpm nx serve admin  # serve는 기본이 development
```

---

### `serve` 타겟

```json
"serve": {
  "continuous": true,
  "executor": "@angular/build:dev-server",
  "configurations": {
    "production": { "buildTarget": "admin:build:production" },
    "development": { "buildTarget": "admin:build:development" }
  },
  "defaultConfiguration": "development"
}
```

**`continuous: true`** — 파일이 바뀌면 자동으로 새로 빌드하고 브라우저를 새로고침해요 (Hot Reload).

개발할 때 이 명령으로 서버를 띄워요:
```bash
pnpm nx serve admin
# http://localhost:4200 에서 실시간 개발 가능
```

`serve`의 `defaultConfiguration`은 `development`예요. `build`와 다른 점이죠.

---

### `lint` 타겟

```json
"lint": {
  "executor": "@nx/eslint:lint"
}
```

ESLint로 코드 품질을 검사해요.

```bash
pnpm nx lint admin  # 코드 스타일 검사
```

---

### `serve-static` 타겟

```json
"serve-static": {
  "continuous": true,
  "executor": "@nx/web:file-server",
  "options": {
    "buildTarget": "admin:build",
    "port": 4200,
    "staticFilePath": "dist/apps/admin/browser",
    "spa": true
  }
}
```

이미 빌드된 파일을 정적 파일 서버로 서빙해요.

- `serve`는 개발용 (빌드 + 실시간 변경 감지)
- `serve-static`은 미리 빌드된 파일을 그냥 서빙 (프리뷰/배포 테스트용)

`spa: true` → SPA(Single Page Application) 모드. 어떤 URL로 접근해도 `index.html`을 반환해요 (Angular 라우터가 처리하도록).

---

## server/project.json 분석

```json
{
  "name": "server",
  "sourceRoot": "apps/server/src",
  "projectType": "application",
  "targets": { ... }
}
```

---

### `build` 타겟 (Webpack)

```json
"build": {
  "executor": "nx:run-commands",
  "options": {
    "command": "webpack-cli build",
    "args": ["--node-env=production"],
    "cwd": "apps/server"
  },
  "configurations": {
    "development": {
      "args": ["--node-env=development"]
    }
  }
}
```

admin 앱은 `@angular/build:application` executor를 썼는데, server는 `nx:run-commands`를 써요.

`nx:run-commands` = 직접 shell 명령어를 실행하는 executor

```
실제로 실행되는 명령:
  cd apps/server
  webpack-cli build --node-env=production
```

NestJS는 Angular처럼 전용 executor가 없어서, Webpack CLI를 직접 실행하는 방식을 써요.

---

### `serve` 타겟

```json
"serve": {
  "continuous": true,
  "executor": "@nx/js:node",
  "defaultConfiguration": "development",
  "dependsOn": ["build"],
  "options": {
    "buildTarget": "server:build",
    "runBuildTargetDependencies": false
  },
  "configurations": {
    "development": { "buildTarget": "server:build:development" },
    "production": { "buildTarget": "server:build:production" }
  }
}
```

`executor: "@nx/js:node"` → Node.js 앱을 실행하는 Nx 전용 executor

`dependsOn: ["build"]` → serve 하기 전에 항상 build 먼저 실행

```bash
pnpm nx serve server
# 1. server:build 자동 실행
# 2. 빌드된 파일을 Node.js로 실행
# 3. http://localhost:3000 에서 API 사용 가능
```

---

### 배포 관련 타겟들

```json
"prune-lockfile": {
  "dependsOn": ["build"],
  "executor": "@nx/js:prune-lockfile",
  ...
},
"copy-workspace-modules": {
  "dependsOn": ["build"],
  "executor": "@nx/js:copy-workspace-modules",
  ...
},
"prune": {
  "dependsOn": ["prune-lockfile", "copy-workspace-modules"],
  "executor": "nx:noop"
}
```

이것들은 **서버를 Docker 컨테이너로 배포**할 때 사용하는 타겟들이에요.

- `prune-lockfile` → 배포에 필요한 의존성만 추린 lock 파일 생성
- `copy-workspace-modules` → 필요한 모듈만 복사
- `prune` → 위 두 작업을 한번에 실행하는 그룹 타겟 (실제 동작은 없음, `nx:noop`)

지금 당장 배포할 때는 안 써도 되는 타겟들이에요.

---

## admin vs server 비교

| 항목 | admin (Angular) | server (NestJS) |
|------|----------------|-----------------|
| 언어 | TypeScript → JS + HTML + CSS | TypeScript → JS |
| 빌드 도구 | `@angular/build:application` | Webpack CLI |
| 실행 환경 | 브라우저 | Node.js |
| serve executor | `@angular/build:dev-server` | `@nx/js:node` |
| 기본 포트 | 4200 | 3000 |
| Hot Reload | 자동 (파일 변경 감지) | 빌드 후 재시작 필요 |

---

## 자주 쓰는 명령 정리

```bash
# admin 개발 서버 시작
pnpm nx serve admin

# server 개발 서버 시작
pnpm nx serve server

# admin 프로덕션 빌드
pnpm nx build admin

# server 빌드
pnpm nx build server

# 두 앱 동시에 시작 (개발할 때 유용)
pnpm nx run-many -t serve -p admin server
```
