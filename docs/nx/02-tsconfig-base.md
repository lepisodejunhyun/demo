# tsconfig.base.json — 프로젝트 간 코드 공유의 핵심

**파일 위치:** `tsconfig.base.json` (프로젝트 루트)

---

## 이 파일이 왜 필요한가?

TypeScript는 `.ts` 파일을 JavaScript로 변환(컴파일)하는 도구예요. `tsconfig.base.json`은 TypeScript에게 "어떻게 변환할지" 알려주는 설정 파일입니다.

특히 모노레포(여러 앱이 한 폴더에 있는 구조)에서는 **"다른 앱/라이브러리의 코드를 어떻게 가져올지"** 를 설정하는 게 매우 중요해요.

---

## 실제 코드 전체

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "ignoreDeprecations": "5.0",
    "rootDir": ".",
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "es2015",
    "module": "esnext",
    "lib": ["es2020", "dom"],
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@org/api/products": ["libs/api/products/src/index.ts"],
      "@org/models": ["libs/shared/models/src/index.ts"],
      "@org/shop/data": ["libs/shop/data/src/index.ts"],
      "@org/shop/feature-product-detail": ["libs/shop/feature-product-detail/src/index.ts"],
      "@org/shop/feature-products": ["libs/shop/feature-products/src/index.ts"],
      "@org/shop/shared-ui": ["libs/shop/shared-ui/src/index.ts"],
      "@api-client": ["libs/api-client/src/index.ts"],
      "@api-client/client": ["libs/api-client/src/client.gen.ts"]
    }
  },
  "exclude": ["node_modules", "tmp"]
}
```

---

## 1. 컴파일러 옵션들 (`compilerOptions`)

### `target: "es2015"`

TypeScript 코드를 **어느 버전의 JavaScript로 변환**할지 정해요.

```typescript
// 우리가 쓴 TypeScript (화살표 함수, 클래스 등)
const greet = (name: string) => `Hello, ${name}!`;

// es2015로 변환한 결과 (대부분 브라우저/Node에서 동작)
const greet = (name) => `Hello, ${name}!`;
```

`es2015`는 2015년 JavaScript 표준이에요. 현재 거의 모든 환경에서 지원하는 안전한 버전입니다.

---

### `module: "esnext"`

`import/export` 문법을 **어떤 방식으로 처리**할지 결정해요.

```typescript
// 우리가 쓰는 방식 (ESM - ES Module)
import { something } from './somewhere';
export const value = 42;
```

`esnext`는 최신 ES 모듈 방식을 그대로 유지해요. Angular, NestJS 모두 이 방식을 사용합니다.

---

### `moduleResolution: "node"`

`import something from 'somewhere'`를 쓸 때 `somewhere`를 **어디서 찾을지** 결정해요.

`node` 방식은 Node.js가 `node_modules`를 찾는 방식과 동일하게 작동해요.

```
import { express } from 'express'
  → node_modules/express/ 폴더에서 찾아요
```

---

### `emitDecoratorMetadata: true` + `experimentalDecorators: true`

**데코레이터**를 사용할 수 있게 해주는 설정이에요.

데코레이터란 `@` 기호로 시작하는 특별한 문법이에요:

```typescript
@Injectable()          // ← 이게 데코레이터
export class AdminService {

  @Get('/hello')       // ← 이것도 데코레이터
  getHello() { ... }

}
```

NestJS와 Angular 모두 데코레이터를 아주 많이 사용해요. 이 설정이 없으면 데코레이터를 쓸 수 없어요.

---

### `sourceMap: true`

빌드된 JavaScript 파일과 원본 TypeScript 파일을 연결하는 **지도 파일**을 생성해요.

```
실제 브라우저/Node에서 실행되는 파일: admin.js (빌드된 JS)
개발자가 작성한 파일: app.ts (원본 TS)

sourceMap이 있으면:
  → 브라우저 개발자 도구에서 에러가 나도
  → "admin.js 42번째 줄" 대신
  → "app.ts 15번째 줄"로 표시해줌 (디버깅이 훨씬 쉬워짐!)
```

---

### `skipLibCheck: true`

`node_modules` 안에 있는 외부 라이브러리의 타입 파일은 **검사하지 않아요**.

왜냐하면 외부 라이브러리에 타입 오류가 있을 수도 있는데, 그건 우리가 고칠 수 있는 게 아니거든요. `skipLibCheck`가 없으면 외부 라이브러리 오류 때문에 우리 프로젝트 빌드가 실패할 수 있어요.

---

### `ignoreDeprecations: "5.0"`

TypeScript 5.0에서 deprecated(앞으로 사라질 예정)로 표시된 옵션들에 대한 경고를 무시해요.

이 프로젝트의 TypeScript 버전은 `5.9.3`이에요. "6.0"으로 설정하면 에러가 발생해서 "5.0"으로 유지합니다.

---

## 2. `paths` — 모노레포의 핵심 ⭐

### 문제: 상대 경로의 불편함

여러 앱이 공유 라이브러리를 쓸 때, 상대 경로로 import 하면 이렇게 됩니다:

```typescript
// apps/admin/src/app/pages/auth/sign-in/sign-in.component.ts 에서
import { adminControllerSignin } from '../../../../../libs/api-client/src/index';
//                                    ^^^^^^^^^^^^^^^^^ 너무 길고 복잡해요!
```

폴더 구조가 조금만 바뀌어도 `../` 개수가 달라져서 모든 import 구문을 수정해야 해요.

---

### 해결책: path alias (경로 별명)

```json
"baseUrl": ".",
"paths": {
  "@api-client": ["libs/api-client/src/index.ts"],
  "@api-client/client": ["libs/api-client/src/client.gen.ts"]
}
```

`baseUrl: "."` → 경로의 기준점을 프로젝트 루트(`/workspace/demo`)로 설정

`paths` → "이 이름으로 import하면 실제로는 이 파일을 봐라"는 **별명 테이블**

```typescript
// 이제 이렇게 쓸 수 있어요!
import { adminControllerSignin } from '@api-client';
// 실제로는 libs/api-client/src/index.ts를 가리킴

// 어느 파일에서 쓰더라도 항상 같은 경로
// 폴더 구조가 바뀌어도 이 코드는 수정 불필요
```

**npm 패키지처럼 사용하지만 실제로는 로컬 파일** → 별도 npm publish 없이 자유롭게 공유

---

### `@api-client`와 `@api-client/client`가 따로 있는 이유

```json
"@api-client":        ["libs/api-client/src/index.ts"]
"@api-client/client": ["libs/api-client/src/client.gen.ts"]
```

같은 `api-client` 라이브러리인데 진입점이 두 개예요.

**`@api-client`** — API 함수들의 모음

```typescript
// sdk.gen.ts의 함수들이 여기서 export됨
import { adminControllerSignin, adminControllerFindAll } from '@api-client';
// 실제 API 호출할 때 사용
```

**`@api-client/client`** — HTTP 클라이언트 인스턴스

```typescript
// client.gen.ts의 createClient 결과물
import { client } from '@api-client/client';
client.setConfig({ baseUrl: 'http://localhost:3000' });
// 앱 초기화 시 서버 주소 설정할 때 사용
```

이렇게 분리한 이유:
- `app.config.ts` (앱 설정)에서는 `setConfig()`만 필요하고 API 함수는 필요 없어요
- 각 페이지 컴포넌트에서는 API 함수만 필요해요
- 필요한 것만 정확히 가져올 수 있어 코드가 깔끔해져요

---

### 다른 path alias들

```json
"@org/models": ["libs/shared/models/src/index.ts"],
"@org/shop/data": ["libs/shop/data/src/index.ts"],
```

`@org/` 로 시작하는 것들은 이 프로젝트에서 자동 생성된 샘플 라이브러리들이에요. 나중에 삭제할 예정이에요.

---

## 3. `exclude` — TypeScript 검사에서 제외할 폴더

```json
"exclude": ["node_modules", "tmp"]
```

- `node_modules` → 외부 라이브러리 폴더 (우리 코드가 아님)
- `tmp` → 임시 파일 폴더

이 폴더들은 TypeScript 검사 대상에서 제외해요.

---

## 4. 각 앱의 tsconfig와 관계

```
tsconfig.base.json           ← 워크스페이스 전체의 기본 설정
    ↑
    extends (상속)
    ↑
apps/admin/tsconfig.json     ← admin 앱에서 기본 설정을 가져와서
    ↑                           admin 전용 옵션 추가
    extends
    ↑
apps/admin/tsconfig.app.json ← 실제 빌드할 때 사용하는 설정
```

각 앱은 `tsconfig.base.json`을 상속받아서 공통 설정을 그대로 쓰고, 앱별로 필요한 설정만 추가해요.

```json
// apps/admin/tsconfig.json 예시
{
  "extends": "../../tsconfig.base.json",  // 기본 설정 가져오기
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",       // admin 전용 출력 폴더
    "strict": true                         // admin 전용 strict 모드
  }
}
```

---

## 전체 흐름 요약

```
tsconfig.base.json
  │
  ├── compilerOptions
  │   ├── target, module    → 어떤 JS로 변환할지
  │   ├── decorators        → @Injectable() 등 데코레이터 허용
  │   ├── sourceMap         → 디버깅 편의를 위한 소스맵 생성
  │   └── skipLibCheck      → 외부 라이브러리 타입 오류 무시
  │
  ├── paths (⭐ 핵심)
  │   ├── @api-client       → libs/api-client/src/index.ts
  │   └── @api-client/client → libs/api-client/src/client.gen.ts
  │   → "이 이름으로 import하면 저 파일을 봐라"
  │
  └── exclude
      → 타입 검사에서 제외할 폴더
```

**핵심을 한 줄로:** `paths` 설정 덕분에 각 앱이 로컬 라이브러리를 마치 npm 패키지처럼 깔끔하게 import할 수 있어요.
