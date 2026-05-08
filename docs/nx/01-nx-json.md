# nx.json — Nx의 두뇌

**파일 위치:** `nx.json` (프로젝트 루트)

---

## 이 파일이 왜 필요한가?

이 프로젝트에는 여러 개의 앱이 함께 들어있어요.

```
apps/
├── admin   ← Angular 어드민 앱
├── server  ← NestJS 백엔드 서버
└── ...

libs/
└── api-client  ← admin이 server와 통신할 때 쓰는 공유 라이브러리
```

이렇게 여러 앱이 한 폴더에 있을 때 문제가 생겨요.

- `admin`을 수정했는데 `server`까지 다시 빌드할 필요는 없잖아요.
- `api-client`(공유 라이브러리)를 수정했다면, 그걸 쓰는 `admin`은 다시 빌드해야 하죠.
- 이걸 사람이 매번 직접 판단하면 실수가 생기고, 시간도 많이 걸려요.

**Nx가 이 모든 걸 자동으로 처리**합니다. `nx.json`은 Nx에게 "어떻게 할지" 알려주는 설정 파일이에요.

---

## 실제 코드 전체

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/.eslintrc.json",
      "!{projectRoot}/eslint.config.mjs",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/src/test-setup.[jt]s",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/test-setup.[jt]s"
    ],
    "sharedGlobals": []
  },
  "targetDefaults": {
    "@angular/build:application": {
      "cache": true,
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "@nx/eslint:lint": {
      "cache": true,
      "inputs": ["default", "^default", ...]
    },
    "@nx/esbuild:esbuild": {
      "cache": true,
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "@nx/vitest:test": {
      "cache": true,
      "inputs": ["default", "^production"]
    }
  },
  "plugins": [...],
  "generators": {...},
  "analytics": false
}
```

---

## 1. `namedInputs` — "뭐가 바뀌면 다시 작업해야 해?"

### 핵심 개념: 캐시(Cache)

Nx는 **결과물을 저장**해둬요. 마치 시험 문제를 한 번 풀어서 답안지를 보관해두는 것처럼요.

- 다음에 같은 문제(입력값이 같은 코드)가 나오면 → 저장된 답안지를 그냥 꺼내씀 (빠름!)
- 코드가 바뀌었다면 → 다시 풀어야 함 (캐시 무효화)

그럼 "코드가 바뀌었는지"를 어떻게 알까요? 파일 목록을 정해두고 그 파일들이 바뀌었는지 확인해요. 이 파일 목록을 `namedInputs`로 정의합니다.

---

### `default` — 기본 입력 목록

```json
"default": ["{projectRoot}/**/*", "sharedGlobals"]
```

- `{projectRoot}` → 각 프로젝트의 루트 폴더를 의미하는 변수예요.
  - admin 프로젝트라면 → `apps/admin/`
  - server 프로젝트라면 → `apps/server/`
- `/**/*` → 그 폴더 안의 **모든 파일**을 포함
- `sharedGlobals` → 워크스페이스 전체에 영향 주는 파일들 (지금은 비어있음)

**쉽게 말하면:** "이 프로젝트 폴더 안에 있는 파일 중 하나라도 바뀌면 다시 작업해"

---

### `production` — 프로덕션 빌드용 입력 목록

```json
"production": [
  "default",
  "!{projectRoot}/**/*.spec.ts",     // 테스트 파일 제외
  "!{projectRoot}/eslint.config.mjs"  // ESLint 설정 제외
]
```

`!` 기호는 "이건 빼고"라는 뜻이에요.

**왜 이렇게 하냐고요?**

예를 들어 테스트 파일(`*.spec.ts`)만 수정했어요. 실제 앱 코드는 하나도 안 바뀌었죠. 그런데 테스트 파일이 바뀌었다고 앱을 다시 빌드할 필요는 없잖아요? 그래서 테스트 파일은 프로덕션 빌드 캐시 판단에서 제외합니다.

```
테스트 파일만 수정했을 때:
  default 기준 → 파일이 바뀌었으니 캐시 무효화 (테스트 재실행은 해야 함)
  production 기준 → 테스트 파일 제외이므로 캐시 유효 (앱 빌드는 그대로 사용)
```

---

### `sharedGlobals` — 전체에 영향 주는 파일들

```json
"sharedGlobals": []
```

지금은 비어있지만, 여기에 파일을 넣으면 그 파일이 바뀌었을 때 **모든 프로젝트의 캐시가 한꺼번에 무효화**돼요.

예를 들어 `package.json`(의존성 파일)을 넣는다면:
```json
"sharedGlobals": ["{workspaceRoot}/package.json"]
```
→ `package.json`이 바뀌면 (새 패키지 설치 등) 모든 앱을 다시 빌드

---

## 2. `targetDefaults` — "각 작업의 기본 규칙"

### "타겟(target)"이란?

타겟은 `build`, `test`, `lint`, `serve` 같은 **작업의 이름**이에요.

```bash
pnpm nx build admin   # "build"가 타겟
pnpm nx test admin    # "test"가 타겟
pnpm nx lint admin    # "lint"가 타겟
```

`targetDefaults`는 이 작업들의 기본 동작 방식을 정의해요.

---

### Angular 빌드 타겟

```json
"@angular/build:application": {
  "cache": true,
  "dependsOn": ["^build"],
  "inputs": ["production", "^production"]
}
```

**`cache: true`**
- 빌드 결과물을 저장해둬요
- 다음에 같은 코드로 빌드하면 → 저장된 결과를 그대로 사용 (매우 빠름)

**`dependsOn: ["^build"]`**

이게 Nx에서 가장 중요한 개념이에요!

`^` (캐럿) 기호는 "나한테 의존하는 라이브러리들"을 의미해요.

```
admin 앱은 api-client 라이브러리에 의존해요.
admin에서 이걸 씁니다:
  import { adminControllerSignin } from '@api-client';
```

`"^build"` = "내가 의존하는 프로젝트들(api-client 등)의 build를 먼저 실행해라"

**실제 동작:**
```bash
pnpm nx build admin  # 이 명령 하나만 쳐도
  # 1. Nx: "admin은 api-client에 의존하네"
  # 2. api-client build 자동 실행
  # 3. api-client 완료 후 admin build 실행
```

직접 `pnpm nx build api-client`를 먼저 치지 않아도 자동으로 순서를 맞춰줘요!

비유로 설명하면:
```
요리사가 파스타를 만들려면(admin build)
→ 소스 재료가 먼저 준비되어야 함(api-client build)
→ dependsOn: ["^build"] 이 관계를 자동으로 처리해주는 것
```

**`inputs: ["production", "^production"]`**
- `"production"` → 이 프로젝트(admin)의 production 파일들이 캐시 판단 기준
- `"^production"` → 의존 라이브러리(api-client)의 production 파일들도 포함

```
api-client 코드 수정
  → ^production에 의해 감지
  → admin 캐시 무효화
  → admin 자동 재빌드
```

---

### ESLint 타겟

```json
"@nx/eslint:lint": {
  "cache": true,
  "inputs": ["default", "^default", ...]
}
```

`dependsOn`이 없어요. lint(코드 품질 검사)는 다른 프로젝트를 빌드할 필요 없이 독립적으로 실행할 수 있거든요.

---

### Vitest 테스트 타겟

```json
"@nx/vitest:test": {
  "cache": true,
  "inputs": ["default", "^production"]
}
```

`dependsOn`은 없지만 `"^production"`은 있어요. 의존 라이브러리 코드가 바뀌면 테스트도 다시 돌려봐야 하니까요.

---

## 3. `plugins` — "어떤 도구들을 쓸 건지"

```json
"plugins": [
  { "plugin": "@nx/playwright/plugin", "options": { "targetName": "e2e" } },
  { "plugin": "@nx/eslint/plugin", "options": { "targetName": "lint" } },
  { "plugin": "@nx/docker", ... },
  { "plugin": "@nx/vite/plugin", ... },
  { "plugin": "@nx/webpack/plugin", ... }
]
```

플러그인은 Nx가 각 프로젝트 폴더를 스캔해서 **자동으로 타겟을 등록**해주는 역할을 해요.

**예시:**

`apps/admin/` 폴더에 `eslint.config.mjs` 파일이 있어요.

```
@nx/eslint/plugin이 이걸 발견
  → "admin 프로젝트에 lint 타겟 자동 등록!"
  → pnpm nx lint admin 명령 사용 가능
```

`project.json`에 일일이 lint 타겟을 안 써도 자동으로 됩니다!

---

### 각 플러그인 역할

| 플러그인 | 역할 | 감지 기준 |
|---------|------|-----------|
| `@nx/playwright` | E2E(통합) 테스트 | `playwright.config.ts` 존재 시 |
| `@nx/eslint` | 코드 품질 검사 | `eslint.config.mjs` 존재 시 |
| `@nx/docker` | Docker 빌드/실행 | `Dockerfile` 존재 시 |
| `@nx/vite` | Vite 빌드/서버 | `vite.config.ts` 존재 시 |
| `@nx/webpack` | Webpack 빌드 | webpack 설정 존재 시 |

---

## 4. `generators` — "코드 생성 기본값"

```json
"generators": {
  "@nx/angular:application": {
    "e2eTestRunner": "playwright",
    "linter": "eslint",
    "style": "css",
    "unitTestRunner": "vitest-analog"
  },
  "@nx/angular:library": {
    "linter": "eslint",
    "unitTestRunner": "vitest-analog"
  },
  "@nx/angular:component": {
    "style": "css"
  }
}
```

Nx로 새 앱, 라이브러리, 컴포넌트를 생성할 때 매번 옵션을 입력하지 않아도 여기서 정의한 기본값이 적용돼요.

**예시:**

```bash
# 이 명령을 치면
pnpm nx generate @nx/angular:component sign-in

# 스타일 파일을 어떤 형식으로? 라고 안 물어봐요
# generators에 "style": "css" 가 있으니까
# 자동으로 sign-in.component.css로 생성됨
```

---

## 전체 흐름 요약

```
nx.json
  │
  ├── namedInputs    → "어떤 파일이 바뀌면 캐시를 버릴까?"
  │
  ├── targetDefaults → "각 작업(build/test/lint)의 기본 규칙"
  │                    └── dependsOn: "어떤 순서로 실행할까?"
  │                    └── cache: "결과를 저장할까?"
  │                    └── inputs: "무엇을 캐시 판단 기준으로 쓸까?"
  │
  ├── plugins        → "프로젝트 스캔해서 타겟 자동 등록"
  │
  └── generators     → "nx generate 시 기본값"
```

**핵심을 한 줄로:** nx.json은 Nx에게 "어떤 순서로, 언제 재실행하고, 언제 캐시를 쓸지" 알려주는 설정 파일입니다.
