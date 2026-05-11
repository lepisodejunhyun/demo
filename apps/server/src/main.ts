/**
 * ============================================================
 * [ main.ts란? ]
 * 1. 개념: NestJS 앱의 "진입점(Entry Point)". `nx serve server` 실행 시
 *          가장 먼저 실행되는 파일. 여기서 앱 인스턴스를 만들고 서버를 띄움.
 *
 * 2. 비유: 자동차의 시동 스위치.
 *          AppModule이 자동차 본체라면, main.ts는 키를 돌려 시동을 거는 역할.
 *
 * 3. 부트스트랩(Bootstrap)이란?
 *    - 컴퓨터 용어로 "스스로 시작하는 과정".
 *    - 어원: "자기 부츠 끈을 잡고 자신을 들어 올린다(bootstrap)"는 표현에서 옴.
 *    - 의미: 외부 도움 없이 프로그램이 자기 자신을 시작하는 코드.
 *
 * [ 이 파일에서 배울 수 있는 핵심 개념 ]
 * 1. dotenv/config         — .env 파일 자동 로드 (DB URL, 비밀번호 등)
 * 2. NestFactory.create()  — NestJS 앱 인스턴스 생성
 * 3. async 함수            — Promise 반환 + 내부에서 await 사용 가능
 * 4. setGlobalPrefix('api')— 모든 라우트 앞에 '/api' 자동 부착
 * 5. enableCors()          — 브라우저의 CORS 정책 우회 허용
 * 6. Pipe와 ValidationPipe — DTO 자동 검증 시스템
 * 7. SwaggerModule         — OpenAPI 스펙 자동 생성
 * 8. apiReference (Scalar) — Swagger UI보다 예쁜 API 문서 뷰어
 * 9. ng-openapi-gen        — OpenAPI 스펙 → Angular용 API 클라이언트 자동 생성
 * ============================================================
 */

/**
 * ============================================================
 * [ import 'dotenv/config' — .env 파일 자동 로드 ]
 *
 * 1. 일반 import와의 차이:
 *    - 일반: import { foo } from 'bar';   ← 변수/함수를 가져옴
 *    - 여기: import 'dotenv/config';       ← 그냥 그 파일을 "실행"만 함
 *    → 변수를 가져오는 게 아니라 "부수 효과(side effect)"를 발생시킴.
 *
 * 2. 부수 효과란?
 *    dotenv/config 파일이 실행되면서 .env 파일을 읽어 process.env에 채워 넣음.
 *    이후 코드에서 process.env.DATABASE_URL 같이 접근 가능해짐.
 *
 * 3. 왜 가장 위에 import?
 *    다른 모듈이 process.env를 읽기 전에 먼저 로드되어야 하기 때문.
 *    순서가 늦으면 다른 코드가 환경 변수를 못 읽고 undefined가 됨.
 *    → import 순서가 의미를 가지는 드문 경우.
 *
 * 4. .env 파일 예시:
 *    DATABASE_URL=postgresql://admin:secret@localhost:5432/myapp
 *    DEFAULT_ADMIN_USERNAME=admin@example.com
 *    DEFAULT_ADMIN_PASSWORD=SecurePass123!
 * ============================================================
 */
import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import { NgOpenApiGen } from 'ng-openapi-gen';
import { Options } from 'ng-openapi-gen/lib/options';


/**
 * ============================================================
 * [ async function bootstrap() — 부트스트랩 함수 ]
 *
 * 1. async가 붙은 이유:
 *    - 안에서 await를 여러 번 써야 함 (NestFactory.create, app.listen 등).
 *    - async를 붙이면 자동으로 Promise를 반환하는 함수가 됨.
 *
 * 2. 함수로 감싸는 이유:
 *    - JavaScript는 최상위 코드에서 await를 못 씀(과거 기준).
 *    - 그래서 비동기 로직을 async 함수 안에 넣고, 그 함수를 호출하는 패턴이 관용.
 *    - 함수 이름을 bootstrap()으로 짓는 건 NestJS의 공식 컨벤션.
 *
 * 3. 함수 호출은 파일 맨 아래의 bootstrap(); 한 줄.
 * ============================================================
 */
async function bootstrap() {
  /**
   * [ NestFactory.create(AppModule) — 앱 인스턴스 생성 ]
   *
   * 1. NestFactory의 정체:
   *    - NestJS가 제공하는 정적 클래스. 앱 인스턴스를 만드는 공장(factory).
   *    - .create()는 그 공장의 핵심 메서드.
   *
   * 2. 내부적으로 일어나는 일:
   *    a) AppModule을 분석하여 모든 import된 모듈을 재귀적으로 로드.
   *    b) 각 모듈의 providers를 DI 컨테이너에 등록.
   *    c) 모든 인스턴스를 만들고 의존성을 자동으로 주입.
   *    d) onModuleInit 등 생명주기 훅을 순서대로 실행.
   *       (이때 admin.module의 최고관리자 시딩이 실행됨)
   *
   * 3. await가 필요한 이유:
   *    위 과정 중 DB 연결처럼 비동기 작업이 있어서.
   *    await로 모든 초기화가 끝날 때까지 기다림.
   */
  const app = await NestFactory.create(AppModule);

  /**
   * ============================================================
   * [ enableCors() — CORS 허용 ]
   *
   * 1. CORS(Cross-Origin Resource Sharing)란?
   *    - 브라우저의 보안 정책.
   *    - 기본적으로 브라우저는 "현재 페이지의 도메인과 다른 도메인으로의 요청"을 차단함.
   *    - 정확히는 도메인 + 포트 + 프로토콜 조합("origin")이 다르면 차단.
   *
   * 2. 왜 차단하는가?
   *    악성 사이트가 사용자의 쿠키로 다른 사이트(예: 은행)에 몰래 요청 보내는 것을 방지.
   *
   * 3. 이 프로젝트에서 문제가 되는 상황:
   *    - admin 앱은 http://localhost:4200
   *    - server 앱은 http://localhost:3000
   *    - 포트가 다르므로 origin이 다름 → 브라우저가 admin 앱의 API 호출을 차단.
   *
   * 4. enableCors()의 효과:
   *    서버 응답에 "Access-Control-Allow-Origin: *" 같은 헤더를 추가.
   *    → 브라우저가 "서버가 허용한다고 했네" 하고 통과시킴.
   *
   * 5. 운영 환경 주의:
   *    enableCors() 만 호출하면 모든 출처 허용 (개발에는 OK, 운영에는 위험).
   *    enableCors({ origin: 'https://admin.example.com' })처럼 제한해야 안전.
   * ============================================================
   */
  app.enableCors();

  /**
   * ============================================================
   * [ setGlobalPrefix('api') — 전역 경로 접두사 ]
   *
   * 1. 효과: 모든 Controller 경로 앞에 '/api'를 자동으로 붙임.
   *    예: @Controller('admins')의 @Get() → 실제 URL: GET /api/admins
   *
   * 2. 왜?
   *    - API와 정적 파일(html/이미지)을 URL로 구분하기 위해.
   *      '/api/admins' (API) vs '/dashboard.html' (정적 파일)
   *    - 향후 버전 분리도 쉬워짐: 'api/v1', 'api/v2' 등.
   *
   * 3. 작동 원리:
   *    - 라우트 매칭 시 NestJS가 자동으로 접두사를 붙여서 등록.
   *    - 각 컨트롤러는 자기 path만 신경 쓰면 됨.
   * ============================================================
   */
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  /**
   * [ 포트 결정 ]
   * 1. process.env.PORT가 있으면 그 값 사용. 없으면 3000 기본값.
   * 2. || 연산자: 왼쪽이 falsy(빈 문자열, undefined 등)면 오른쪽 값 사용.
   * 3. 운영 환경에서는 보통 PORT 환경 변수를 외부에서 주입함.
   *    (Docker, Kubernetes, Heroku 등이 자동으로 PORT 환경 변수를 설정)
   */
  const port = process.env.PORT || 3000;


  /**
   * ============================================================
   * [ Swagger 문서 생성 ]
   *
   * 1. Swagger(OpenAPI)란?
   *    - REST API를 기계가 읽을 수 있는 형식(JSON/YAML)으로 표현한 스펙.
   *    - "이 API는 어떤 입출력을 가지는가"를 표준으로 기록.
   *    - 이 스펙만 있으면 다양한 도구가 자동으로 문서/클라이언트 코드를 생성 가능.
   *
   * 2. SwaggerModule.createDocument(app, builder, options)
   *    - 앱의 모든 Controller/DTO를 분석해서 OpenAPI 스펙(JSON)을 만들어줌.
   *    - admin.controller의 @ApiOperation, admin.dto의 @ApiProperty 등이 모두 반영됨.
   *    - 결과: API의 모든 정보가 담긴 거대한 JSON 객체.
   *
   * 3. DocumentBuilder
   *    - API 메타데이터(제목, 버전, 인증 방식 등)를 설정하는 빌더.
   *    - 메서드 체이닝 패턴: .setTitle('...').setVersion('1').build()
   *    - 빌더 패턴(Builder Pattern): 복잡한 객체를 단계적으로 만들어가는 디자인 패턴.
   * ============================================================
   */
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Swagger Document')
      .build(),
    {}
  );

  /**
   * [ Scalar API Reference — '/reference' 엔드포인트 ]
   *
   * 1. 무엇인가?
   *    - NestJS 기본 Swagger UI(/api 경로) 대신 사용하는 모던한 문서 뷰어.
   *    - Scalar(scalar.com)라는 회사의 오픈소스 도구.
   *
   * 2. app.use('/reference', ...)
   *    - 서버에 '/reference' 경로용 미들웨어를 등록.
   *    - http://localhost:3000/reference 접속 → 깔끔한 API 문서 UI.
   *
   * 3. spec.content에 위에서 만든 document 객체를 전달.
   *    → 우리 서버의 모든 API가 그 UI에 나타남.
   */
  app.use(
    '/reference',
    apiReference({
      spec: {
        content: document,
      },
    })
  );

  /**
   * ============================================================
   * [ Pipe란? ]
   * 1. 개념: 컨트롤러 핸들러에 데이터가 들어가기 전에 거치는 "전처리기".
   * 2. 종류:
   *    - 변환(Transformation) Pipe: 타입 변환 (예: 문자열 "1" → 숫자 1)
   *    - 검증(Validation) Pipe:     데이터가 규칙에 맞는지 확인
   * 3. 비유: 공항 보안 검색대.
   *    - 모든 짐(=요청 데이터)이 검색대(Pipe)를 거쳐야 통과.
   *    - 문제 있으면 입국 거부(400 에러), 통과하면 핸들러에 전달.
   *
   * [ ValidationPipe — 전역 입력 검증 ]
   * 1. 모든 컨트롤러의 @Body(), @Query(), @Param() 데이터를 자동으로 검증.
   *    - admin-sign-in.dto.ts의 @IsEmail, @MinLength 등이 자동 적용됨.
   *    - 검증 실패 시 NestJS가 자동으로 400 Bad Request 응답을 반환.
   *
   * 2. useGlobalPipes(new ValidationPipe(...))
   *    - "전역(global)" Pipe로 등록 = 모든 라우트에 자동 적용.
   *    - 각 컨트롤러에 일일이 @UsePipes() 안 붙여도 됨.
   *
   * 3. 옵션 의미:
   *
   *    a) whitelist: true
   *       → DTO에 정의되지 않은 필드는 자동으로 제거.
   *       예: { email, password, hackerField: '...' } 보내도 hackerField는 버려짐.
   *       → 알지 못하는 필드가 코드에 도달하지 않게 함 (보안).
   *
   *    b) forbidNonWhitelisted: true
   *       → DTO에 없는 필드가 들어오면 아예 400 에러로 거부 (더 엄격).
   *       whitelist만 있으면 조용히 제거, 이걸 켜면 명시적으로 차단.
   *       → "이상한 필드 보내지 마라"는 강한 신호.
   *
   *    c) transform: true
   *       → 들어온 평범한 객체를 DTO 클래스 인스턴스로 자동 변환.
   *       → "1"(문자열) → 1(숫자)처럼 타입 자동 변환도 수행.
   *       → admin.dto의 @Expose 같은 데코레이터가 동작하려면 이 옵션이 필요.
   * ============================================================
   */
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  /**
   * ============================================================
   * [ API 클라이언트 자동 생성 ]
   *
   * 1. 무엇을 하는가?
   *    Swagger로 만든 OpenAPI 스펙을 바탕으로
   *    libs/api-client/src/lib에 Angular용 타입 안전 클라이언트 코드를 생성.
   *
   * 2. 결과:
   *    - admin 앱에서 import { Api, adminControllerSignin } from '@api-client' 가능.
   *    - sign-in.page.ts의 api.invoke(adminControllerSignin, {...})가 이걸 활용.
   *
   * 3. 장점:
   *    - 서버를 수정하면 → 자동으로 클라이언트 코드가 갱신.
   *    - 타입 불일치를 컴파일 단계에서 잡음. ("이 필드는 string인데 number로 보내네!")
   *    - URL 경로/HTTP 메서드/파라미터를 손으로 적을 일이 없음.
   *
   * 4. .then으로만 처리하고 await 안 한 이유:
   *    - 서버 시작을 지연시키지 않기 위해.
   *    - "백그라운드에서 클라이언트 코드 생성하고, 끝나면 로그만 찍어"라는 의도.
   *    - 서버는 그 사이 정상적으로 listen 시작.
   * ============================================================
   */
  generateApiClient(document).then(() => {
    Logger.log('API Client Generated');
  });

  /**
   * [ app.listen(port) — 실제 서버 띄우기 ]
   *
   * 1. 이 줄 이전: 앱이 메모리에 준비된 상태 (아직 요청 받지 않음).
   * 2. 이 줄 이후: 실제 HTTP 서버가 포트에서 요청을 받기 시작.
   * 3. await 이유: listen()이 Promise를 반환 (서버 시작 완료 시점을 알리기 위함).
   * 4. 이 줄에 도달했다는 건 모든 초기화가 성공했다는 신호.
   */
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

/**
 * 부트스트랩 함수 호출 — 모든 게 여기서 시작.
 * await 없이 호출 = "백그라운드에서 알아서 시작해" (어차피 모듈 평가 후 다른 일 없음).
 */
bootstrap();

/**
 * ============================================================
 * [ generateApiClient — OpenAPI 스펙 → Angular 클라이언트 변환 ]
 *
 * 단계별 동작:
 *
 * 1. options 객체 준비:
 *    a) input: JSON.parse(JSON.stringify(document))
 *       → document 객체를 깊은 복사. 원본을 건드리지 않기 위함.
 *       → JSON.stringify로 문자열화 후 JSON.parse로 다시 객체로 = 가장 간단한 깊은 복사 트릭.
 *    b) output: 'libs/api-client/src/lib'
 *       → 결과물이 저장될 폴더.
 *    c) indexFile: true
 *       → 모든 export를 한 곳에서 모아주는 index.ts 자동 생성.
 *    d) silent: true
 *       → 진행 로그 출력 안 함 (콘솔이 깔끔해짐).
 *
 * 2. $RefParser.bundle()
 *    → OpenAPI 스펙 안의 $ref(다른 정의 참조) 링크들을 모두 실제 값으로 풀어줌.
 *    → JSON 스펙은 "이 타입은 저쪽 정의 참조"라는 식의 포인터를 많이 씀.
 *      RefParser가 그 포인터를 다 따라가서 한 덩어리 객체로 만들어줌.
 *    → dereference: { circular: false } — 순환 참조는 건너뛰기.
 *
 * 3. new NgOpenApiGen(...).generate()
 *    → 풀어낸 스펙을 바탕으로 Angular용 TypeScript 클라이언트 파일들을 생성.
 *
 * [ any 타입의 의미 ]
 * - any: "이 변수의 타입을 검사하지 마"라는 TypeScript의 특수 타입.
 * - 여기서 document: any 사용: 외부 라이브러리(ng-openapi-gen)와의 호환 때문.
 * - 일반적으로 any 사용은 지양하나, 변환 도구처럼 동적인 코드에서는 어쩔 수 없는 경우 존재.
 *
 * 결과 파일들은 admin 앱이 `@api-client`로 import해서 바로 사용함.
 * ============================================================
 */
const generateApiClient = async (document: any) => {
  const options: Options = {
    input: JSON.parse(JSON.stringify(document)),
    output: 'libs/api-client/src/lib',
    indexFile: true,
    silent: true,
  }

  const RefParser = new $RefParser();
  const openApi: any = await RefParser.bundle(options.input, {
    dereference: { circular: false },
  });

  const ngOpenGen = new NgOpenApiGen(openApi, options);
  ngOpenGen.generate();
};
