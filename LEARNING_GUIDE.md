# 프로젝트 학습 가이드

이 문서는 이 프로젝트(`demo`)에서 실제로 사용된 함수, 데코레이터, API를 정리한 학습 자료입니다.
각 항목마다 **개념 → 왜 필요한가 → 사용 방법 → 프로젝트의 실제 코드 예시** 순으로 정리합니다.

## 프로젝트 구성 개요

| 영역 | 기술 스택 | 위치 |
| --- | --- | --- |
| 서버 — 관리자용 (Backend) | NestJS + Prisma + PostgreSQL | `apps/server/` |
| 서버 — 사용자용 (Backend) | NestJS + Prisma + JWT + Passport | `apps/server-shop/` |
| 관리자 (Frontend) | Angular 21 (standalone, zoneless) | `apps/admin/` |
| 사용자 (Frontend) | Angular 21 (standalone, SSR) | `apps/shop/` |
| 데이터베이스 스키마 | Prisma (멀티 파일) | `prisma/` |
| 컨테이너 인프라 | Docker Compose | `docker/` |
| 관리자용 API 클라이언트 | ng-openapi-gen | `libs/api-client/` |
| 사용자용 API 클라이언트 | ng-openapi-gen | `libs/api-client-shop/` |

---

# 1. NestJS (Backend)

## 1.1 NestFactory — 앱 인스턴스 생성

**개념**: NestJS 앱의 인스턴스를 만드는 정적 팩토리 클래스. 모든 NestJS 앱은 `NestFactory.create(루트모듈)` 호출로 시작합니다.

**왜 필요한가**: NestJS는 IoC(역제어) 컨테이너를 가지고 있어서, 우리가 직접 `new` 키워드로 객체를 만들지 않습니다. NestFactory가 모듈 트리를 분석해 모든 의존성을 자동으로 만들고 연결해줍니다.

**사용 방법**: `NestFactory.create(AppModule)`를 호출해 `INestApplication` 인스턴스를 받음.

**프로젝트 예시** — [apps/server/src/main.ts](apps/server/src/main.ts#L13):
```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ... 설정 ...
  await app.listen(port);
}
bootstrap();
```

## 1.2 `@Module()` — 모듈 정의

**개념**: 관련 있는 Controller, Service, Listener를 하나로 묶는 데코레이터.

**왜 필요한가**: 기능을 도메인 단위(Admin, FAQ, Notice)로 나눠서 관리하기 위해. 모듈 단위로 의존성이 자동 관리됩니다.

**옵션 4가지**:
- `imports`: 다른 모듈 가져오기 (그 모듈의 exports를 사용 가능)
- `controllers`: HTTP 요청 입구
- `providers`: 서비스 등록
- `exports`: 외부에 공개할 providers

**프로젝트 예시** — [apps/server/src/app/app.module.ts](apps/server/src/app/app.module.ts):
```ts
@Module({
  imports: [PrismaModule, AdminModule, EventEmitterModule.forRoot(), FaqModule, NoticeModule, EventModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
```

[apps/server/src/app/admin/admin.module.ts](apps/server/src/app/admin/admin.module.ts):
```ts
@Module({
  imports: [],
  controllers: [AdminController],
  providers: [AdminService, AdminListener],
})
export class AdminModule implements OnModuleInit { ... }
```

## 1.3 `@Global()` — 전역 모듈

**개념**: 한 번만 import해두면 다른 모든 모듈에서 그 exports를 자동으로 사용할 수 있게 만드는 데코레이터.

**왜 필요한가**: DB처럼 거의 모든 도메인에서 쓰는 모듈을 매번 import 하면 번거롭기 때문.

**사용 방법**: `@Module` 위에 `@Global()` 추가.

**프로젝트 예시** — [apps/server/src/prisma/prisma.module.ts](apps/server/src/prisma/prisma.module.ts):
```ts
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

## 1.4 `@Controller()` — 컨트롤러 정의

**개념**: HTTP 요청을 받는 클래스를 표시. 안의 메서드들이 라우트가 됩니다.

**왜 필요한가**: URL을 코드와 매핑. `'event'`라고 적으면 `/api/event` 경로로 들어오는 요청을 이 클래스가 처리.

**프로젝트 예시** — [apps/server/src/app/event/event.controller.ts](apps/server/src/app/event/event.controller.ts#L10):
```ts
@ApiTags('event')
@Controller('event')
export class EventController { ... }
```

## 1.5 HTTP 메서드 데코레이터 — `@Get`, `@Post`, `@Patch`, `@Delete`

**개념**: 컨트롤러 메서드를 특정 HTTP 메서드 + 경로에 매핑.

| 데코레이터 | 의미 | 보통 용도 |
| --- | --- | --- |
| `@Get('path')` | GET 요청 | 데이터 조회 |
| `@Post('path')` | POST 요청 | 신규 생성 |
| `@Patch('path')` | PATCH 요청 | 부분 수정 |
| `@Delete('path')` | DELETE 요청 | 삭제 |

**프로젝트 예시** — [apps/server/src/app/faq/faq.controller.ts](apps/server/src/app/faq/faq.controller.ts):
```ts
@Get()                  // GET /api/faq
async findAll(...) { }

@Post('create')         // POST /api/faq/create
async create(...) { }

@Get(':id')             // GET /api/faq/:id
async findById(...) { }

@Patch(':id')           // PATCH /api/faq/:id
async update(...) { }

@Delete(':id')          // DELETE /api/faq/:id
async remove(...) { }
```

## 1.6 파라미터 데코레이터 — `@Body`, `@Param`, `@Query`

**개념**: 요청에서 데이터를 추출하는 데코레이터.

| 데코레이터 | 추출 대상 | 예시 URL/요청 |
| --- | --- | --- |
| `@Body()` | 요청 본문 (JSON) | POST /faq/create + body `{question, answer}` |
| `@Param('id')` | URL 경로 변수 | GET /faq/abc123 → id = 'abc123' |
| `@Query()` | 쿼리스트링 | GET /event?page=2&limit=10 |

**프로젝트 예시** — [apps/server/src/app/faq/faq.controller.ts:71](apps/server/src/app/faq/faq.controller.ts#L71):
```ts
async findById(@Param('id') id: string): Promise<FaqDTO> { ... }

async create(@Body() data: FaqCreateDTO): Promise<FaqDTO> { ... }
```

[apps/server/src/app/event/event.controller.ts:35](apps/server/src/app/event/event.controller.ts#L35):
```ts
async findAll(@Query() query: PaginationQueryDTO): Promise<...> {
    const result = await this.eventService.findAll(query.page, query.limit);
    ...
}
```

## 1.7 `@Injectable()` — 주입 가능한 서비스

**개념**: 클래스를 NestJS DI 컨테이너가 관리하도록 등록.

**왜 필요한가**: 다른 곳(컨트롤러, 다른 서비스)에서 `constructor`로 주입받아 사용하려면 필수.

**프로젝트 예시** — [apps/server/src/app/admin/admin.service.ts](apps/server/src/app/admin/admin.service.ts):
```ts
@Injectable()
export class AdminService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly eventEmitter: EventEmitter2
    ) {}
    // ...
}
```

## 1.8 의존성 주입 (Dependency Injection) — `constructor` 주입

**개념**: 클래스가 필요한 객체를 직접 `new`로 생성하지 않고, 외부(NestJS)로부터 주입받는 패턴.

**문법**: `constructor(private readonly 변수명: 타입) {}`
- `private`: 클래스 내부에서만 접근 가능
- `readonly`: 한번 주입되면 변경 불가

**프로젝트 예시** — [apps/server/src/app/event/event.service.ts](apps/server/src/app/event/event.service.ts#L7):
```ts
@Injectable()
export class EventService {
    constructor(
        private readonly prisma: PrismaService
    ) { }
    // this.prisma로 DB 접근 가능
}
```

## 1.9 `ValidationPipe` + `useGlobalPipes` — 입력 검증

**개념**: 모든 DTO를 자동으로 검증해서 잘못된 요청은 컨트롤러에 도달하기 전에 차단하는 파이프.

**왜 필요한가**: 컨트롤러 코드에서 매번 `if (!email) throw ...` 같은 검증을 안 써도 되게 함. DTO에 `@IsEmail` 같은 데코레이터만 붙이면 자동 검증.

**옵션**:
- `whitelist: true` — DTO에 없는 필드는 제거
- `forbidNonWhitelisted: true` — DTO에 없는 필드 있으면 400 에러
- `transform: true` — 평범한 객체를 DTO 클래스 인스턴스로 변환

**프로젝트 예시** — [apps/server/src/main.ts:39](apps/server/src/main.ts#L39):
```ts
app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
}));
```

## 1.10 `enableCors()` — CORS 허용

**개념**: 브라우저의 CORS 보안 정책을 우회 허용하도록 응답 헤더를 추가.

**왜 필요한가**: admin 앱(`localhost:4200`)과 server 앱(`localhost:3000`)이 다른 origin이라 기본적으로 브라우저가 차단함.

**프로젝트 예시** — [apps/server/src/main.ts](apps/server/src/main.ts):
```ts
app.enableCors();
```

## 1.11 `setGlobalPrefix` — 전역 경로 접두사

**개념**: 모든 컨트롤러의 경로 앞에 자동으로 붙는 접두사.

**프로젝트 예시** — [apps/server/src/main.ts:18](apps/server/src/main.ts#L18):
```ts
app.setGlobalPrefix('api');
// 결과: @Controller('faq')의 라우트가 /api/faq로 노출됨
```

## 1.12 예외 클래스 — `NotFoundException`, `UnauthorizedException`

**개념**: 특정 HTTP 상태 코드로 응답하는 내장 예외 클래스.

| 예외 클래스 | HTTP 상태 |
| --- | --- |
| `NotFoundException` | 404 |
| `UnauthorizedException` | 401 |
| `BadRequestException` | 400 |
| `ForbiddenException` | 403 |
| `ConflictException` | 409 |
| `InternalServerErrorException` | 500 |

**왜 필요한가**: `throw`만 하면 NestJS가 자동으로 적절한 응답을 클라이언트에 보내줌.

**프로젝트 예시** — [apps/server/src/app/admin/admin.service.ts](apps/server/src/app/admin/admin.service.ts):
```ts
if (!admin) {
    throw new UnauthorizedException({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
    });
}
```

[apps/server/src/app/notice/notice.service.ts](apps/server/src/app/notice/notice.service.ts):
```ts
if (!notice) throw new NotFoundException('공지사항을 찾을 수 없습니다.');
```

## 1.13 `Logger` — 내장 로그 도구

**개념**: NestJS 내장 로깅 클래스. 색상과 컨텍스트가 자동으로 입혀짐.

**레벨**: `log()`(초록), `warn()`(노랑), `error()`(빨강), `debug()`, `verbose()`.

**프로젝트 예시** — [apps/server/src/app/admin/admin.module.ts](apps/server/src/app/admin/admin.module.ts):
```ts
export class AdminModule implements OnModuleInit {
    private readonly logger = new Logger(AdminModule.name);

    async onModuleInit() {
        this.logger.warn('최고 관리자 이메일 또는 비밀번호가 설정되지 않았습니다.');
        this.logger.log(`최고 관리자(${this.defaultAdminEmail})가 이미 존재합니다.`);
        this.logger.error('최고 관리자 생성 중 에러 발생:', error);
    }
}
```

## 1.14 생명주기 훅 — `OnModuleInit` / `onModuleInit()`

**개념**: NestJS가 모듈을 초기화하는 특정 시점에 자동 호출되는 콜백.

**훅 종류**:
| 인터페이스 | 메서드 | 호출 시점 |
| --- | --- | --- |
| `OnModuleInit` | `onModuleInit()` | 모듈 초기화 직후 |
| `OnApplicationBootstrap` | `onApplicationBootstrap()` | 모든 모듈 초기화 후 |
| `OnModuleDestroy` | `onModuleDestroy()` | 모듈 종료 직전 |
| `OnApplicationShutdown` | `onApplicationShutdown()` | 앱 종료 시 |

**왜 필요한가**: DB 연결 수립, 기본 데이터 시딩 같은 "초기화 작업"을 안전한 시점에 실행.

**프로젝트 예시** — [apps/server/src/prisma/prisma.service.ts](apps/server/src/prisma/prisma.service.ts):
```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        await this.$connect();  // 부팅 시 DB 연결
    }
}
```

[apps/server/src/app/admin/admin.module.ts](apps/server/src/app/admin/admin.module.ts):
```ts
export class AdminModule implements OnModuleInit {
    async onModuleInit() {
        // 서버 시작 시 최고 관리자 자동 시딩
    }
}
```

## 1.15 EventEmitter — `EventEmitterModule.forRoot()`, `eventEmitter.emit()`, `@OnEvent()`

**개념**: 발행/구독(Pub/Sub) 패턴을 위한 이벤트 시스템.

**사용 흐름**:
1. AppModule에서 `EventEmitterModule.forRoot()` 등록
2. Service에서 `this.eventEmitter.emit(이벤트명, payload)`로 발행
3. Listener에서 `@OnEvent(이벤트명)`로 수신

**왜 필요한가**: Service의 책임을 분리하기 위해. 로그인 검증과 "마지막 로그인 시각 기록"을 같은 함수에 넣지 않고, 이벤트로 분리하면 깔끔.

**프로젝트 예시 — 발행** [apps/server/src/app/admin/admin.service.ts](apps/server/src/app/admin/admin.service.ts):
```ts
this.eventEmitter.emit(AdminEvents.ADMIN_LOGGED_IN, { admin })
```

**예시 — 수신** [apps/server/src/app/admin/admin.listener.ts](apps/server/src/app/admin/admin.listener.ts):
```ts
@OnEvent(AdminEvents.ADMIN_LOGGED_IN)
async handleAdminLoggedInEvent(payload: { admin: Admin }) {
    const { admin } = payload;
    this.logger.log(`관리자 로그인 이벤트 처리 완료: ${admin.email}`);
}
```

**예시 — 등록** [apps/server/src/app/app.module.ts](apps/server/src/app/app.module.ts):
```ts
imports: [..., EventEmitterModule.forRoot(), ...]
```

---

## 1.16 JWT 인증 — `JwtModule`, `JwtService`

**개념**: JSON Web Token(JWT)은 사용자의 신원 정보를 암호화된 문자열로 만들어 주고받는 인증 방식입니다. 쿠키나 세션과 달리 **서버에 상태를 저장하지 않아도(stateless)** 되는 것이 가장 큰 장점입니다.

**왜 필요한가**: 전통적인 세션 방식은 서버가 "이 사람은 로그인했다"는 정보를 메모리에 들고 있어야 합니다. 서버가 여러 대면 세션 동기화가 복잡해집니다. JWT는 토큰 자체에 사용자 정보가 담겨 있어서, 아무 서버나 토큰만 검증하면 누구인지 알 수 있습니다.

**JWT의 구조**: `eyJhbGci...` 같은 긴 문자열은 실제로 3개 파트가 `.`으로 구분되어 있습니다:
```
헤더.페이로드.서명
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhYmMxMjMiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20ifQ.서명값
```
- **헤더(Header)**: 암호화 알고리즘 정보 (`HS256`)
- **페이로드(Payload)**: 실제 데이터 (`{ sub: "abc123", email: "test@test.com" }`)
- **서명(Signature)**: 위변조 방지용 해시값 (secret key로 생성)

**Access Token vs Refresh Token**:
| 구분 | Access Token | Refresh Token |
| --- | --- | --- |
| 용도 | API 호출 시 인증 | Access Token 만료 시 재발급 |
| 만료 시간 | 짧음 (1시간) | 김 (7일) |
| 저장 위치 | localStorage | httpOnly 쿠키 |
| 탈취 위험 | XSS로 가능 → 만료가 짧아 피해 최소화 | httpOnly라 JS로 접근 불가 |

**사용 방법 — 모듈 등록**: `JwtModule.register()`로 NestJS에 JWT 기능을 추가합니다.

**프로젝트 예시** — [apps/server-shop/src/app/member/member.module.ts](apps/server-shop/src/app/member/member.module.ts):
```ts
@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET_MEMBER || 'default-member-secret-key',
            // ↑ 토큰 암호화에 사용할 비밀키. .env에서 읽어오고, 없으면 기본값 사용.
            //   이 키가 유출되면 누구나 토큰을 위조할 수 있으므로 반드시 비밀 유지.
            signOptions: { expiresIn: '1h' },
            // ↑ 기본 만료 시간. sign() 호출 시 별도 지정하지 않으면 이 값 사용.
        }),
        PassportModule,
        // ↑ passport 인증 전략을 사용하기 위한 모듈 (아래 1.17에서 설명)
    ],
    // ...
})
```

| 옵션 | 의미 | 예시 |
| --- | --- | --- |
| `secret` | 토큰 암호화 비밀키 | `'my-super-secret-key'` |
| `signOptions.expiresIn` | 기본 만료 시간 | `'1h'`(1시간), `'7d'`(7일), `'30m'`(30분) |

**사용 방법 — 토큰 발급**: `jwtService.sign(payload, options)`를 호출합니다.

**프로젝트 예시 — 토큰 발급** [apps/server-shop/src/app/member/member.service.ts](apps/server-shop/src/app/member/member.service.ts):
```ts
const payload = { sub: member.id, email: member.email };
// ↑ JWT 안에 담을 데이터. sub는 JWT 표준 필드로 "이 토큰의 주인"을 의미.
//   여기에 비밀번호 같은 민감 정보를 절대 넣으면 안 됨 (payload는 Base64 디코딩하면 읽을 수 있음).

const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
// ↑ payload를 암호화하여 토큰 문자열 생성. 1시간 후 만료.
//   결과: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIi..." 같은 긴 문자열

const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
// ↑ 같은 payload지만 만료 시간만 7일로 설정. Access Token 재발급용.
```

**사용 방법 — 토큰 검증**: `jwtService.verify(token)`로 토큰이 유효한지 확인합니다.

**프로젝트 예시 — Refresh Token 검증** [apps/server-shop/src/app/member/member.service.ts](apps/server-shop/src/app/member/member.service.ts):
```ts
async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
        const payload = this.jwtService.verify(refreshToken);
        // ↑ 토큰을 복호화하여 payload 추출. 만료/위조된 토큰이면 에러 발생.
        //   성공하면: { sub: "abc123", email: "test@test.com", iat: 1234567890, exp: 1234567890 }

        const member = await this.prisma.member.findFirst({
            where: { id: payload.sub, deletedAt: null },
        });
        // ↑ 토큰은 유효하지만, 그 사이에 탈퇴했을 수 있으므로 DB에서 한번 더 확인

        const newPayload = { sub: member.id, email: member.email };
        const accessToken = this.jwtService.sign(newPayload, { expiresIn: '1h' });
        return { accessToken };
        // ↑ 새로운 Access Token 발급. Refresh Token은 그대로 유지.
    } catch {
        throw new UnauthorizedException('Refresh Token이 만료되었습니다. 다시 로그인해주세요.');
        // ↑ verify()가 실패하면 여기로. 사용자는 다시 로그인해야 함.
    }
}
```

| 메서드 | 용도 | 실패 시 |
| --- | --- | --- |
| `sign(payload, options)` | payload → JWT 문자열 생성 | - |
| `verify(token)` | JWT 문자열 → payload 추출 | 만료/위조 시 에러 throw |

## 1.17 Passport — `PassportStrategy`, `AuthGuard`

**개념**: Passport는 Node.js에서 가장 많이 쓰이는 인증 라이브러리입니다. "전략(Strategy)" 패턴으로 동작하여, JWT 전략, 카카오 전략, 구글 전략 등을 **같은 방식으로** 추가할 수 있습니다.

**왜 필요한가**: 인증 로직을 직접 짜면 매 컨트롤러에서 토큰 파싱 → 검증 → 사용자 조회를 반복해야 합니다. Passport + Guard를 쓰면 **데코레이터 하나(`@UseGuards`)만 붙이면** 자동으로 인증이 적용됩니다.

**동작 순서**:
1. 클라이언트가 `Authorization: Bearer eyJ...` 헤더와 함께 요청
2. `JwtAuthGuard`가 요청을 가로챔
3. `JwtStrategy`가 토큰에서 payload 추출
4. `validate()` 메서드가 호출되어 DB에서 사용자 확인
5. `validate()`의 반환값이 `req.user`에 저장됨
6. 컨트롤러 메서드가 `@Req() req`로 사용자 정보 접근

**프로젝트 예시 — JWT 전략 정의** [apps/server-shop/src/app/member/strategies/jwt.strategy.ts](apps/server-shop/src/app/member/strategies/jwt.strategy.ts):
```ts
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
// ↑ passport-jwt: JWT 토큰 인증 전용 Passport 전략 패키지

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
// ↑ PassportStrategy(Strategy): passport-jwt의 Strategy를 NestJS에서 쓸 수 있도록 래핑하는 함수.
//   이렇게 하면 NestJS의 DI(의존성 주입)와 호환됩니다.

    constructor(private readonly prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            // ↑ "Authorization: Bearer eyJ..." 헤더에서 토큰 부분만 추출하는 함수.
            //   다른 옵션도 있음: fromBodyField('token'), fromUrlQueryParameter('token') 등

            ignoreExpiration: false,
            // ↑ false = 만료된 토큰 거부 (기본이자 권장값)
            //   true로 하면 만료 토큰도 통과시킴 (보안 위험)

            secretOrKey: process.env.JWT_SECRET_MEMBER || 'default-member-secret-key',
            // ↑ 토큰 서명 검증에 사용할 키. sign()할 때 쓴 secret과 동일해야 함.
        });
    }

    async validate(payload: { sub: string; email: string }) {
    // ↑ 토큰이 유효하면 (서명 OK + 만료 안 됨) 이 메서드가 자동 호출됨.
    //   payload는 sign() 할 때 넣었던 데이터: { sub: "회원ID", email: "이메일" }

        const member = await this.prisma.member.findFirst({
            where: { id: payload.sub, deletedAt: null },
        });
        // ↑ 토큰은 유효하지만, 그 사이에 회원이 탈퇴(soft delete)했을 수 있으므로 DB에서 확인

        if (!member) {
            throw new UnauthorizedException('유효하지 않은 토큰입니다.');
            // ↑ 탈퇴한 회원이면 401 에러
        }

        return member;
        // ↑ 이 반환값이 req.user에 자동으로 저장됨!
        //   이후 컨트롤러에서 @Req() req → req.user.id, req.user.email 접근 가능
    }
}
```

## 1.18 `@UseGuards()` — 가드 적용

**개념**: 컨트롤러나 개별 메서드에 인증/인가 가드를 적용하는 데코레이터입니다. 가드가 `false`를 반환하거나 에러를 throw하면 요청이 컨트롤러에 도달하지 못합니다.

**왜 필요한가**: 매 API 메서드마다 "토큰 있나? → 유효한가? → 이 사람 회원인가?"를 확인하는 코드를 반복 작성하지 않아도 됩니다. 데코레이터 하나로 끝.

**적용 위치**:
| 위치 | 범위 | 예시 |
| --- | --- | --- |
| 클래스 위 | 해당 컨트롤러의 **모든 메서드** | `@UseGuards(JwtAuthGuard)` + `@Controller()` |
| 메서드 위 | 해당 메서드만 | 특정 API만 인증 필요할 때 |

**프로젝트 예시 — 클래스 레벨 적용** [apps/server-shop/src/app/inquiry/inquiry.controller.ts](apps/server-shop/src/app/inquiry/inquiry.controller.ts):
```ts
@UseGuards(JwtAuthGuard)
// ↑ 이 줄 하나로 아래 컨트롤러의 findAll(), findById(), create() 모든 메서드에 인증 필수 적용.
//   토큰 없이 요청하면 자동으로 401 Unauthorized 응답.

@ApiBearerAuth()
// ↑ Swagger 문서에 🔒 자물쇠 아이콘 표시.
//   Swagger에서 API 테스트할 때 "Authorize" 버튼으로 토큰을 입력할 수 있게 됨.

@Controller('inquiry')
export class InquiryController { ... }
```

**JwtAuthGuard의 정체** — [apps/server-shop/src/app/member/guards/jwt-auth.guard.ts](apps/server-shop/src/app/member/guards/jwt-auth.guard.ts):
```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }
// ↑ 단 한 줄! AuthGuard('jwt')가 위의 JwtStrategy를 자동으로 찾아서 실행합니다.
//   'jwt'는 passport-jwt Strategy의 기본 이름입니다.
//   만약 카카오 전략을 만들면 AuthGuard('kakao')가 됩니다.
```

## 1.19 `@Req()`, `@Res()` — Request/Response 직접 접근

**개념**: Express의 Request/Response 객체를 컨트롤러 메서드에서 직접 다루기 위한 데코레이터입니다.

**왜 필요한가**: `@Req()`는 Passport가 넣어준 `req.user`에 접근하기 위해, `@Res()`는 쿠키를 설정하기 위해 사용합니다. 보통은 `@Body()`, `@Param()` 같은 추상화된 데코레이터로 충분하지만, 이 두 가지는 Express의 원시 객체가 필요합니다.

| 데코레이터 | 무엇을 가져오나 | 프로젝트에서의 용도 |
| --- | --- | --- |
| `@Req()` | Express Request 객체 | `req.user`에서 JWT 인증된 사용자 정보 꺼냄 |
| `@Res({ passthrough: true })` | Express Response 객체 | `res.cookie()`로 Refresh Token 쿠키 설정 |

**프로젝트 예시 — @Req로 인증된 사용자 ID 가져오기** [apps/server-shop/src/app/inquiry/inquiry.controller.ts](apps/server-shop/src/app/inquiry/inquiry.controller.ts):
```ts
async findAll(@Req() req: Request, @Query() query: PaginationQueryDTO) {
    const memberId = (req.user as any).id;
    // ↑ JwtStrategy의 validate()가 return한 member 객체가 req.user에 담겨 있음.
    //   (req.user as any)는 TypeScript 타입 단언. Express의 Request 타입에는
    //   user 프로퍼티의 타입이 정의되어 있지 않아서 any로 캐스팅.

    return this.inquiryService.findAllByMemberId(memberId, query.page, query.limit);
    // ↑ 이 회원의 문의만 조회. 다른 사람의 문의는 조회 불가 (보안).
}
```

**프로젝트 예시 — @Res로 쿠키 설정** [apps/server-shop/src/app/member/kakao-auth.controller.ts](apps/server-shop/src/app/member/kakao-auth.controller.ts):
```ts
async kakaoLogin(
    @Body() data: KakaoLoginDTO,
    @Res({ passthrough: true }) res: Response,
    // ↑ passthrough: true → NestJS가 반환값을 자동으로 응답 본문으로 보내줌.
    //   false(기본값)이면 res.send()를 직접 호출해야 함.
) {
    const { accessToken, refreshToken, member } = await this.kakaoAuthService.handleKakaoLogin(data.code);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        // ↑ JavaScript의 document.cookie로 이 쿠키를 읽을 수 없음.
        //   해커가 XSS 공격으로 JS를 실행해도 Refresh Token을 훔칠 수 없음.

        secure: process.env.NODE_ENV === 'production',
        // ↑ true면 HTTPS 연결에서만 쿠키 전송. 개발 환경(http)에서는 false.

        sameSite: 'strict',
        // ↑ 'strict': 다른 사이트에서 우리 서버로 요청할 때 이 쿠키를 절대 보내지 않음.
        //   CSRF(크로스 사이트 요청 위조) 공격 방지.
        //   'lax': GET 요청은 허용, POST는 차단 (보통 이것도 안전).
        //   'none': 제한 없음 (secure: true 필수, 위험).

        maxAge: 7 * 24 * 60 * 60 * 1000,
        // ↑ 쿠키 만료 시간 (밀리초). 7일 = 604,800,000ms.
        //   이 시간이 지나면 브라우저가 자동으로 쿠키 삭제.

        path: '/',
        // ↑ 모든 경로에서 이 쿠키 사용 가능. '/api'로 하면 /api 하위에서만 전송.
    });

    return plainToInstance(SignInResponseDTO, { accessToken, member });
    // ↑ passthrough: true 덕분에 이 반환값이 응답 본문으로 자동 전송됨.
}
```

---

# 1-A. 카카오 소셜 로그인 (OAuth2)

> OAuth2 Authorization Code Grant 방식으로 카카오 로그인을 구현한 흐름.

## 전체 흐름

1. **프론트**: 카카오 인증 서버로 리다이렉트 (`kauth.kakao.com/oauth/authorize`)
2. **카카오**: 사용자 로그인 → 인가 코드 발급 → 콜백 URL로 리다이렉트
3. **프론트 콜백**: URL에서 인가 코드 추출 → 서버로 전달
4. **서버**: 인가 코드 → 카카오 Access Token 교환 → 사용자 정보 조회 → 회원 생성/연결 → **우리 JWT 발급**

## 프론트엔드 — 카카오 리다이렉트

**프로젝트 예시** — [apps/shop/src/app/pages/sign-in/sign-in.page.ts](apps/shop/src/app/pages/sign-in/sign-in.page.ts):
```ts
onKakaoLogin() {
    const clientId = '카카오_REST_API_키';
    const redirectUri = encodeURIComponent('http://localhost:4201/auth/kakao/callback');
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    window.location.href = kakaoAuthUrl;  // 카카오 로그인 페이지로 이동
}
```

- `encodeURIComponent()` — URL 안의 특수문자(`:`, `/`)를 안전한 형태로 변환
- `response_type=code` — OAuth2 표준: "인가 코드를 달라"
- `window.location.href` — 현재 페이지 URL 변경 (리다이렉트)

## 백엔드 — 토큰 교환 + 사용자 조회

**프로젝트 예시** — [apps/server-shop/src/app/member/kakao-auth.service.ts](apps/server-shop/src/app/member/kakao-auth.service.ts):
```ts
// 1. 인가 코드 → 카카오 Access Token 교환
const res = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY!,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
        redirect_uri: process.env.KAKAO_REDIRECT_URI!,
        code,
    }),
});

// 2. Access Token → 사용자 정보 조회
const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
});
```

| 함수/클래스 | 용도 |
| --- | --- |
| `fetch()` | Node.js 내장 HTTP 요청 함수 (서버 간 통신) |
| `new URLSearchParams({...})` | 객체를 `key=value&key2=value2` 형식으로 변환 |
| `Authorization: Bearer xxx` | OAuth2 표준 인증 헤더 |

## 회원 분기 로직

```ts
// SocialAccount 테이블에서 카카오 ID로 검색
const existingSocial = await this.prisma.socialAccount.findUnique({
    where: {
        provider_providerId: {     // @@unique([provider, providerId]) 복합 유니크 키
            provider: 'KAKAO',
            providerId: kakaoId,
        },
    },
    include: { member: true },     // 연결된 Member도 JOIN해서 가져옴
});

if (existingSocial) {
    member = existingSocial.member;  // 재방문 → 기존 회원
} else if (existingMember) {
    // 이메일 가입 회원 → 카카오 계정 연결만 추가
    await this.prisma.socialAccount.create({ data: { memberId, provider: 'KAKAO', providerId: kakaoId } });
} else {
    // 신규 → 회원가입 + 소셜 계정 동시 생성 (Prisma 중첩 생성)
    member = await this.prisma.member.create({
        data: {
            email, name, password: null,
            socialAccounts: {
                create: { provider: 'KAKAO', providerId: kakaoId },  // ← 관계 테이블도 한번에
            },
        },
    });
}
```

---

## 2.1 `SwaggerModule.createDocument` + `DocumentBuilder`

**개념**: 컨트롤러/DTO 데코레이터를 분석해 OpenAPI 스펙(JSON)을 자동 생성.

**프로젝트 예시** — [apps/server/src/main.ts:22](apps/server/src/main.ts#L22):
```ts
const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
        .setTitle('Swagger Document')
        .build(),
    {}
);
```

## 2.2 `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiOkResponse`, `@ApiParam`, `@ApiProperty`, `@ApiExtraModels`

| 데코레이터 | 역할 |
| --- | --- |
| `@ApiTags('faq')` | Swagger 문서에서 API 그룹 이름 |
| `@ApiOperation({ summary, description })` | API 한 줄 요약 + 상세 설명 |
| `@ApiResponse({ description, schema })` | 응답 형태 명시 (복잡한 스키마용) |
| `@ApiOkResponse({ description, type })` | 200 응답 단순 표시 |
| `@ApiParam({ name, type })` | 경로 파라미터 설명 |
| `@ApiProperty({ description, enum, required })` | DTO 필드 설명 |
| `@ApiExtraModels(Class)` | $ref 참조용 모델 명시적 등록 |

**프로젝트 예시** — [apps/server/src/app/faq/faq.controller.ts](apps/server/src/app/faq/faq.controller.ts):
```ts
@ApiTags('faq')
@ApiExtraModels(PageInfoDTO)
@Controller('faq')
export class FaqController {

    @Get()
    @ApiOperation({
        summary: 'FAQ 전체 조회',
        description: "FAQ 목록을 최신순으로 조회합니다."
    })
    @ApiResponse({
        description: "FAQ 목록 조회 성공",
        schema: {
            properties: {
                items: { type: 'array', items: { $ref: '#/components/schemas/FaqDTO' } },
                pageInfo: { $ref: '#/components/schemas/PageInfoDTO' },
            },
        },
    })
    async findAll(...) { ... }

    @Get(':id')
    @ApiParam({ name: 'id', type: String })
    @ApiOkResponse({ description: 'FAQ 상세 조회 성공', type: FaqDTO })
    async findById(...) { ... }
}
```

**예시 — `@ApiProperty`** [apps/server/src/app/admin/dtos/admin.dto.ts](apps/server/src/app/admin/dtos/admin.dto.ts):
```ts
@ApiProperty({
    description: '관리자 권한 등급',
    enum: AdminRole,
})
@Expose()
role: AdminRole;

@ApiProperty({
    description: '관리자 계정 마지막 로그인 시간',
    required: false,
    nullable: true
})
@Expose()
lastLoginAt: Date | null;
```

## 2.3 Scalar API Reference

**개념**: Swagger UI를 대신하는 더 모던한 API 문서 뷰어.

**프로젝트 예시** — [apps/server/src/main.ts:30](apps/server/src/main.ts#L30):
```ts
import { apiReference } from '@scalar/nestjs-api-reference';

app.use(
    '/reference',
    apiReference({
        spec: { content: document },
    })
);
// → http://localhost:3000/reference 접속 시 API 문서 UI 표시
```

---

# 3. Validation (class-validator)

> DTO 필드에 데코레이터로 검증 규칙을 부여. ValidationPipe가 자동으로 검사.

## 3.1 `@IsNotEmpty`, `@IsString`, `@IsEmail`, `@IsInt`, `@IsOptional`

| 데코레이터 | 검사 |
| --- | --- |
| `@IsNotEmpty()` | null/undefined/빈 문자열 아님 |
| `@IsString()` | 문자열 타입 |
| `@IsEmail()` | 이메일 형식 |
| `@IsInt()` | 정수 |
| `@IsOptional()` | 값이 없으면 다른 검증 건너뜀 |

## 3.2 `@MinLength`, `@MaxLength`, `@Min`, `@Max`, `@Matches`

| 데코레이터 | 검사 |
| --- | --- |
| `@MinLength(n)` | 최소 길이 |
| `@MaxLength(n)` | 최대 길이 |
| `@Min(n)` | 최소값 |
| `@Max(n)` | 최대값 |
| `@Matches(regex)` | 정규식 일치 |

**프로젝트 예시** — [apps/server/src/app/admin/dtos/admin-sign-in.dto.ts](apps/server/src/app/admin/dtos/admin-sign-in.dto.ts):
```ts
export class AdminSignInDTO {
    @ApiProperty({ description: '관리자 이메일' })
    @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
    @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
    email: string;

    @ApiProperty({ description: '관리자 비밀번호' })
    @IsNotEmpty({ message: '비밀번호는 필수 입력 항목입니다.' })
    @IsString()
    @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
    @MaxLength(16, { message: '비밀번호는 최대 16자 이하이어야 합니다.' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])/, {
        message: '비밀번호는 영문, 숫자, 특수문자가 모두 포함되어야 합니다.',
    })
    password: string;
}
```

[apps/server/src/libs/dtos/pagination-query.dto.ts](apps/server/src/libs/dtos/pagination-query.dto.ts):
```ts
export class PaginationQueryDTO {
    @ApiProperty({ description: '페이지 번호', required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit: number = 10;
}
```

**중요**: 메시지 옵션(`message: '...'`)을 주면 검증 실패 시 그 메시지가 클라이언트로 그대로 반환됨. 한국어 메시지를 두면 프론트가 그대로 사용자에게 표시 가능.

---

# 4. Serialization (class-transformer)

> 객체 ↔ 클래스 인스턴스 변환 + 직렬화 제어.

## 4.1 `@Exclude()` + `@Expose()` — 화이트리스트 직렬화

**개념**: 클래스 레벨 `@Exclude()`로 기본 차단 → 필드 레벨 `@Expose()`로 표시한 것만 응답에 포함.

**왜 필요한가**: DB 모델에 비밀번호 같은 민감 필드가 있을 때, 명시적으로 표시한 필드만 응답에 나가게 해 사고를 구조적으로 방지.

**프로젝트 예시** — [apps/server/src/app/admin/dtos/admin.dto.ts](apps/server/src/app/admin/dtos/admin.dto.ts):
```ts
@Exclude()                  // ← 클래스 전체 기본 제외
export class AdminDTO {
    @ApiProperty({ description: '관리자 고유 식별자' })
    @Expose()               // ← 이 필드만 응답에 포함
    id: string;

    @ApiProperty({ description: '이메일(로그인ID)' })
    @Expose()
    email: string;

    // password 필드는 정의 자체가 없음 → 자동으로 제외됨
}
```

## 4.2 `plainToInstance()` — 평범한 객체 → 클래스 인스턴스

**개념**: DB에서 받은 plain object를 DTO 클래스 인스턴스로 변환. @Exclude/@Expose가 이때 적용됨.

**프로젝트 예시** — [apps/server/src/app/admin/admin.controller.ts](apps/server/src/app/admin/admin.controller.ts):
```ts
async findAll(): Promise<AdminDTO[]> {
    const admins = await this.adminService.findAll();  // Prisma raw 객체
    return plainToInstance(AdminDTO, admins);          // ← 변환 + 필드 필터링
}
```

## 4.3 `@Type()` — 타입 자동 변환

**개념**: 들어온 값을 다른 타입으로 변환. 주로 쿼리스트링(항상 문자열) → 숫자 변환에 사용.

**프로젝트 예시** — [apps/server/src/libs/dtos/pagination-query.dto.ts](apps/server/src/libs/dtos/pagination-query.dto.ts):
```ts
@IsOptional()
@Type(() => Number)   // ← "1" (string) → 1 (number) 자동 변환
@IsInt()
@Min(1)
page: number = 1;
```

---

# 5. Prisma (DB)

## 5.1 Prisma 스키마 문법

**개념**: 데이터베이스 테이블 구조를 코드로 정의. 이 정의에서 PostgreSQL 테이블과 TypeScript 타입이 자동 생성됨.

**프로젝트 예시** — [prisma/admin.prisma](prisma/admin.prisma):
```prisma
model Admin {
  id          String      @id     @default(uuid())
  name        String
  email       String      @unique
  password    String
  role        AdminRole   @default(관리자)
  failCount   Int         @default(0)
  lockedUntil DateTime?
  lastLoginAt DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @default(now()) @updatedAt
  deletedAt   DateTime?
}

enum AdminRole {
  관리자
  최고관리자
}
```

| 데코레이터 | 의미 |
| --- | --- |
| `@id` | 기본키 (Primary Key) |
| `@default(uuid())` | 기본값으로 UUID 자동 생성 |
| `@default(now())` | 기본값으로 현재 시각 |
| `@updatedAt` | 레코드 수정 시 자동으로 시각 갱신 |
| `@unique` | 중복 불가 |
| `String?` | nullable (값이 없어도 됨) |

[prisma/event.prisma](prisma/event.prisma):
```prisma
model Event {
    id                String     @id  @default(uuid())
    title             String
    content           String
    posterImage       String?
    startDate         DateTime
    endDate           DateTime
    createdAt         DateTime   @default(now())
    updatedAt         DateTime   @default(now())  @updatedAt
    deletedAt         DateTime?
}
```

## 5.2 PrismaClient + PrismaPg 어댑터

**개념**: PrismaClient는 모든 DB 작업의 진입점. PrismaPg는 PostgreSQL용 어댑터.

**프로젝트 예시** — [apps/server/src/prisma/prisma.service.ts](apps/server/src/prisma/prisma.service.ts):
```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        const adapter = new PrismaPg({
            connectionString: process.env.DATABASE_URL!
        });
        super({ adapter });   // ← 부모 클래스 PrismaClient 생성자에 어댑터 전달
    }

    async onModuleInit() {
        await this.$connect();
    }
}
```

## 5.3 Prisma 쿼리 메서드

### `findMany()` — 여러 행 조회
**프로젝트 예시** — [apps/server/src/app/notice/notice.service.ts](apps/server/src/app/notice/notice.service.ts):
```ts
const notices = await this.prisma.notice.findMany({
    where: {
        deletedAt: null,
    },
    orderBy: {
        createdAt: 'desc'
    }
});
```

### `findFirst()` — 조건에 맞는 첫 번째 행
**프로젝트 예시** — [apps/server/src/app/admin/admin.service.ts](apps/server/src/app/admin/admin.service.ts):
```ts
const admin = await this.prisma.admin.findFirst({
    where: {
        email: email,
        deletedAt: null,
    },
});
```

### `findUnique()` — unique 필드로 정확히 한 개 조회
unique 제약이 있는 필드(@id, @unique)만 where에 사용 가능. `findUnique`는 `deletedAt: null` 같은 조건과 함께 쓰면 타입 에러가 나서, 보통 `findFirst`로 대체.

### `create()` — 신규 생성
**프로젝트 예시** — [apps/server/src/app/notice/notice.service.ts](apps/server/src/app/notice/notice.service.ts):
```ts
const notice = await this.prisma.notice.create({
    data: {
        title: title,
        content: content,
    },
});
```

[apps/server/src/app/admin/admin.module.ts](apps/server/src/app/admin/admin.module.ts):
```ts
await this.prisma.admin.create({
    data: {
        email: this.defaultAdminEmail,
        password: hashSync(this.defaultAdminPassword, 10),
        name: '최고 관리자',
        role: AdminRole.최고관리자,
    }
})
```

### `count()` — 행 개수
**프로젝트 예시** — [apps/server/src/app/event/event.service.ts](apps/server/src/app/event/event.service.ts):
```ts
this.prisma.event.count({
    where: { deletedAt: null },
})
```

### 페이지네이션 — `skip`, `take`
**개념**: `skip`은 건너뛸 행 수, `take`는 가져올 행 수. SQL의 OFFSET/LIMIT.

**프로젝트 예시** — [apps/server/src/app/event/event.service.ts](apps/server/src/app/event/event.service.ts):
```ts
async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
        this.prisma.event.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        this.prisma.event.count({
            where: { deletedAt: null },
        }),
    ]);

    return {
        items,
        pageInfo: {
            page,
            limit,
            pageItems: items.length,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
        },
    };
}
```

### `$connect()` — 명시적 DB 연결
**프로젝트 예시** — [apps/server/src/prisma/prisma.service.ts](apps/server/src/prisma/prisma.service.ts):
```ts
async onModuleInit() {
    await this.$connect();
}
```

## 5.4 Soft Delete 패턴

**개념**: 실제로 DELETE하지 않고, `deletedAt` 컬럼에 삭제 시각만 기록. null이면 활성, 값 있으면 삭제됨.

**왜 필요한가**: 실수 복구 가능, 감사 추적, 외래 키 깨짐 방지.

**규칙**: 모든 조회 쿼리에 `where: { deletedAt: null }` 조건을 반드시 추가.

**프로젝트 예시 — 활성만 조회** [apps/server/src/app/faq/faq.service.ts](apps/server/src/app/faq/faq.service.ts):
```ts
const faqs = await this.prisma.faq.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' }
});
```

**프로젝트 예시 — 소프트 삭제**:
```ts
await this.prisma.faq.update({
    where: { id },
    data: { deletedAt: new Date() },  // ← DELETE 대신 update
});
```

---

## 5.5 관계 (Relations) — `@relation`, 1:N

**개념**: 테이블 간 관계를 Prisma 스키마에서 정의합니다. 하나의 Member가 여러 SocialAccount를 가질 수 있는 1:N(일대다) 관계처럼, 테이블 간 연결을 코드로 선언하면 Prisma가 자동으로 FK(외래 키)와 JOIN을 처리합니다.

**왜 필요한가**: 관계형 DB에서 데이터를 여러 테이블로 나눌 때, 테이블 간 참조 관계를 명시해야 합니다. Prisma에서 관계를 정의하면 TypeScript 타입에도 자동 반영되어, `member.socialAccounts`처럼 연관 데이터에 타입 안전하게 접근할 수 있습니다.

**프로젝트 예시 — 1:N 관계** [prisma/member.prisma](prisma/member.prisma) + [prisma/social-account.prisma](prisma/social-account.prisma):
```prisma
// Member 모델 (부모 쪽)
model Member {
    id              String           @id @default(uuid())
    email           String
    name            String
    password        String?
    // ↑ String? = nullable. 소셜 로그인 회원은 비밀번호 없이 가입 가능.

    socialAccounts  SocialAccount[]
    // ↑ 한 Member가 여러 SocialAccount를 가질 수 있음 (1:N).
    //   실제 DB 컬럼이 생기지는 않음. Prisma가 JOIN을 위해 사용하는 가상 필드.
}

// SocialAccount 모델 (자식 쪽)
model SocialAccount {
    id         String   @id @default(uuid())
    memberId   String
    // ↑ FK(외래 키). 이 값이 Member 테이블의 id를 가리킴.
    //   실제 DB에 이 컬럼이 생성됨.

    provider   String
    // ↑ 소셜 서비스 이름: 'KAKAO', 'NAVER', 'GOOGLE' 등

    providerId String
    // ↑ 해당 소셜 서비스에서 부여한 사용자 고유 ID (카카오의 경우 숫자)

    member     Member   @relation(fields: [memberId], references: [id])
    // ↑ @relation: 이 테이블의 memberId 필드가 Member 테이블의 id 필드를 참조한다고 선언.
    //   fields: 이 테이블의 FK 필드  /  references: 부모 테이블의 PK 필드

    @@unique([provider, providerId])
    // ↑ 복합 유니크 키: provider + providerId 조합이 유일해야 함.
    //   예: 같은 카카오 ID로 두 번 가입 불가.
    //   Prisma에서 findUnique({ where: { provider_providerId: {...} } })로 조회 가능.
}
```

| Prisma 문법 | 의미 | 예시 |
| --- | --- | --- |
| `SocialAccount[]` | 1:N 관계의 부모 쪽 | 한 Member → 여러 SocialAccount |
| `@relation(fields: [...], references: [...])` | FK 관계 선언 | memberId가 Member.id를 참조 |
| `@@unique([a, b])` | 복합 유니크 제약 | provider + providerId 조합 중복 불가 |

## 5.6 `include` — 관계 데이터 JOIN 조회

**개념**: `include`는 관계된 테이블의 데이터를 한 번의 쿼리로 함께 가져오는 옵션입니다. SQL의 `JOIN`에 해당하지만, Prisma가 실제로는 2개의 쿼리를 실행한 뒤 결과를 합쳐줍니다.

**왜 필요한가**: `include` 없이 `findUnique()`를 하면 SocialAccount 데이터만 나옵니다. 연결된 Member 정보가 필요하면 `include: { member: true }`를 추가해야 합니다. 이렇게 하면 별도 쿼리 없이 `result.member.email`처럼 접근 가능합니다.

**프로젝트 예시** — [apps/server-shop/src/app/member/kakao-auth.service.ts](apps/server-shop/src/app/member/kakao-auth.service.ts):
```ts
const existingSocial = await this.prisma.socialAccount.findUnique({
    where: {
        provider_providerId: {
            provider: 'KAKAO',
            providerId: kakaoId,
        },
        // ↑ 복합 유니크 키로 검색. Prisma가 @@unique([provider, providerId])에서
        //   자동 생성한 이름이 provider_providerId.
    },
    include: { member: true },
    // ↑ include 없으면: { id, memberId, provider, providerId } 만 반환
    //   include 있으면: { id, memberId, provider, providerId, member: { id, email, name, ... } }
});

// 사용:
if (existingSocial) {
    const member = existingSocial.member;
    // ↑ SocialAccount와 연결된 Member 객체에 바로 접근!
    console.log(member.email);  // 가능
}
```

## 5.7 중첩 생성 (Nested Create)

**개념**: 부모 레코드를 생성하면서 동시에 관계된 자식 레코드도 함께 생성하는 Prisma 기능입니다. 내부적으로 하나의 **트랜잭션**으로 실행되어, 하나라도 실패하면 둘 다 롤백됩니다.

**왜 필요한가**: Member와 SocialAccount를 각각 `create()`로 2번 호출하면, 첫 번째는 성공했는데 두 번째가 실패할 수 있습니다. 그러면 Member는 생겼는데 SocialAccount가 없는 불완전한 데이터가 됩니다. 중첩 생성은 이 문제를 원천 차단합니다.

**프로젝트 예시** — [apps/server-shop/src/app/member/kakao-auth.service.ts](apps/server-shop/src/app/member/kakao-auth.service.ts):
```ts
member = await this.prisma.member.create({
    data: {
        email,
        name,
        password: null,
        // ↑ 소셜 로그인 회원은 비밀번호가 없음. nullable 필드라 null 저장 가능.

        socialAccounts: {
        // ↑ Member 모델에 정의된 관계 필드명 (SocialAccount[])
            create: {
            // ↑ 'create' 키워드: Member를 생성하면서 SocialAccount도 동시에 생성
            //   여러 개 생성: create: [{ ... }, { ... }] 배열도 가능
                provider: 'KAKAO',
                providerId: kakaoId,
                // ↑ memberId는 Prisma가 자동으로 생성된 Member의 id를 넣어줌!
                //   직접 memberId를 지정할 필요 없음.
            },
        },
    },
});
// → SQL로 보면:
//   INSERT INTO "Member" (id, email, name, password) VALUES (...);
//   INSERT INTO "SocialAccount" (id, memberId, provider, providerId) VALUES (...);
//   두 쿼리가 하나의 트랜잭션으로 실행됨.
```

## 5.8 `createMany()`, `deleteMany()` — 다건 생성/삭제

**개념**: 여러 레코드를 한 번의 호출로 INSERT/DELETE하는 메서드입니다.

**왜 필요한가**: 갤러리 이미지처럼 하나의 게시물에 여러 첨부파일이 있을 때, for문으로 하나씩 `create()`하면 N번의 쿼리가 발생합니다. `createMany()`를 쓰면 1번의 쿼리로 처리됩니다.

**프로젝트 예시 — 갤러리 이미지 등록** [apps/server/src/app/gallery/gallery.service.ts](apps/server/src/app/gallery/gallery.service.ts):
```ts
// 1. 갤러리 게시물 생성
const gallery = await this.prisma.gallery.create({
    data: { title, content: content ?? null },
});

// 2. 이미지 URL 목록을 Attachment 테이블에 일괄 저장
await this.prisma.attachment.createMany({
    data: imageUrls.map((url, i) => ({
    // ↑ map(): 배열의 각 원소를 변환. ['url1', 'url2'] → [{ url: 'url1', ... }, { url: 'url2', ... }]
        url,
        entityType: 'gallery',     // 어떤 도메인의 첨부파일인지 (다형성 패턴)
        entityId: gallery.id,       // 갤러리 게시물 ID
        sortOrder: i,               // 정렬 순서 (0, 1, 2, ...)
    })),
});
// → SQL: INSERT INTO "Attachment" (url, entityType, entityId, sortOrder) VALUES (...), (...), (...);
//   N개의 이미지를 1번의 쿼리로 INSERT
```

**프로젝트 예시 — 갤러리 수정 시 기존 이미지 전체 삭제 후 재등록** [apps/server/src/app/gallery/gallery.service.ts](apps/server/src/app/gallery/gallery.service.ts):
```ts
// 1. 기존 이미지 전부 삭제
await this.prisma.attachment.deleteMany({
    where: {
        entityType: 'gallery',
        entityId: id,
    },
});
// → SQL: DELETE FROM "Attachment" WHERE "entityType" = 'gallery' AND "entityId" = '...';
//   조건에 맞는 모든 행이 한 번에 삭제됨. Soft Delete가 아닌 실제 삭제!

// 2. 새 이미지 일괄 등록
await this.prisma.attachment.createMany({
    data: imageUrls.map((url, i) => ({ url, entityType: 'gallery', entityId: id, sortOrder: i })),
});
// ↑ "삭제 후 재등록" 패턴: 어떤 이미지가 추가/삭제/순서변경됐는지 비교하는 것보다
//   전체를 지우고 다시 넣는 것이 로직이 단순합니다.
```

---

# 6. Angular (Frontend)

## 6.1 `bootstrapApplication` — 앱 시작점

**개념**: Standalone Components 방식에서 앱을 시작하는 함수. NgModule 없이 동작.

**프로젝트 예시** — [apps/admin/src/main.ts](apps/admin/src/main.ts):
```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

## 6.2 `ApplicationConfig` + `providers` — 전역 설정

**개념**: 앱 전체에 적용될 의존성/설정을 등록하는 객체.

**프로젝트 예시** — [apps/admin/src/app/app.config.ts](apps/admin/src/app/app.config.ts):
```ts
export const appConfig: ApplicationConfig = {
    providers: [
        provideZonelessChangeDetection(),
        provideBrowserGlobalErrorListeners(),
        provideRouter(appRoutes, withComponentInputBinding()),
        provideHttpClient(),
        provideApiConfiguration('http://localhost:3000'),
    ],
};
```

## 6.3 `provideZonelessChangeDetection()` — Zone.js 없는 변화 감지

**개념**: Angular 18+에서 Zone.js 없이 signal 기반으로 화면을 갱신하는 최신 모드.

**왜 쓰는가**: 더 가벼움(번들 크기 ↓), 더 빠름(불필요한 검사 X), 더 명확함(언제 갱신될지 코드로 보임).

**대신 신경 써야 할 것**: `signal()` / `computed()` / `input()` 같은 반응형 도구를 적극 활용해야 화면이 자동 업데이트됨.

## 6.4 `provideRouter()` + `withComponentInputBinding()`

**개념**: 라우터 등록 + 라우트 파라미터를 컴포넌트의 input()에 자동 주입하는 기능 활성화.

**프로젝트 예시** — [apps/admin/src/app/app.config.ts](apps/admin/src/app/app.config.ts):
```ts
provideRouter(appRoutes, withComponentInputBinding())
```

→ 그 결과 [faq-detail.page.ts](apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.ts)에서 단순히 `id = input<string>();`로 라우트 파라미터를 받을 수 있음.

## 6.5 라우트 설정 — `Route[]`

**개념**: URL 경로와 컴포넌트의 매핑 배열.

**프로젝트 예시** — [apps/admin/src/app/app.routes.ts](apps/admin/src/app/app.routes.ts):
```ts
export const appRoutes: Route[] = [
    { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
    {
        path: 'sign-in',
        data: { title: '관리자 로그인' },
        loadComponent: () => import('./pages/auth/sign-in/sign-in.page'),
    },
    {
        path: '',
        component: DefaultLayout,
        children: [
            { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.page') },
            { path: 'faq/:id', loadComponent: () => import('./pages/faq/faq-detail/faq-detail.page') },
            // ...
        ]
    }
];
```

| 속성 | 의미 |
| --- | --- |
| `path` | URL 경로 |
| `component` | 즉시 로딩되는 컴포넌트 |
| `loadComponent` | 지연 로딩 (Lazy Loading) |
| `redirectTo` | 다른 경로로 자동 이동 |
| `pathMatch: 'full'` | URL이 완전 일치할 때만 적용 |
| `children` | 중첩 라우트 (레이아웃 안에 페이지) |
| `data` | 라우트에 추가 데이터 (title 등) |

## 6.6 `provideHttpClient()` — HTTP 클라이언트

**개념**: Angular의 HTTP 통신 도구를 활성화. `@api-client`의 자동 생성 API도 내부적으로 사용.

## 6.7 `@Component({...})` — 컴포넌트 정의

**개념**: 클래스를 Angular 컴포넌트로 표시.

**옵션**:
- `selector`: HTML에서 사용할 태그명
- `templateUrl`: HTML 파일 경로
- `styleUrl(s)`: CSS 파일 경로
- `imports`: 이 컴포넌트가 사용하는 다른 모듈/컴포넌트
- `host`: 호스트 요소에 부여할 속성/클래스

**프로젝트 예시** — [apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts](apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts):
```ts
@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in.page.html',
    imports: [CommonModule, ReactiveFormsModule],
})
export default class SignInPage { ... }
```

[apps/admin/src/app/components/breadcrumb/breadcrumb.component.ts](apps/admin/src/app/components/breadcrumb/breadcrumb.component.ts):
```ts
@Component({
    selector: 'app-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    imports: [RouterLink],
    host: { 'class': 'block' },
})
export class BreadcrumbComponent { ... }
```

## 6.8 생명주기 훅 — `OnInit` / `ngOnInit()`

**개념**: 컴포넌트가 생성된 후 input들이 다 채워진 시점에 자동 호출되는 메서드.

**왜 constructor가 아닌가**: constructor는 input 주입 전이라 라우트 파라미터 등이 아직 없음. ngOnInit은 그 이후라 안전.

**프로젝트 예시** — [apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.ts](apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.ts):
```ts
export default class FaqDetailPage implements OnInit {
    id = input<string>();

    async ngOnInit() {
        const id = this.id();
        if (!id) return;

        try {
            this.faq = await this.api.invoke(faqControllerFindById, { id });
            this.cdr.markForCheck();
        } catch (error) {
            this.router.navigate(['/faq']);
        }
    }
}
```

## 6.9 `inject()` — 의존성 주입 (최신 방식)

**개념**: NestJS의 constructor 주입에 해당하는 Angular의 새로운 DI 방식.

**왜 constructor 주입 대신 inject()를 쓰는가**: 더 간결하고, 함수 안에서도 호출 가능.

**프로젝트 예시** — [apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.ts](apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.ts):
```ts
private readonly api = inject(Api);
private readonly router = inject(Router);
private readonly cdr = inject(ChangeDetectorRef);
```

## 6.10 Signal API — `signal`, `computed`, `input`, `output`

### `signal<T>(initialValue)` — 반응형 상태

**개념**: 값이 바뀌면 화면이 자동으로 다시 그려지는 변수.

**사용**: 읽기 `state()` (함수 호출), 쓰기 `state.update(...)` 또는 `state.set(...)`.

**프로젝트 예시** — [apps/admin/src/app/stores/admin.store.ts](apps/admin/src/app/stores/admin.store.ts):
```ts
@Injectable({ providedIn: 'root' })
export class AdminStore {
    private readonly state = signal<{ user: AdminDto | null }>({ user: null });

    setUser(user: AdminDto): void {
        this.state.update(s => ({ ...s, user }));
    }
}
```

### `computed(() => ...)` — 파생 상태

**개념**: 다른 signal로부터 계산되는 read-only 값. 의존하는 signal이 바뀌면 자동 재계산.

**프로젝트 예시** — [apps/admin/src/app/stores/admin.store.ts](apps/admin/src/app/stores/admin.store.ts):
```ts
readonly user = computed(() => this.state().user);
```

### `input<T>()` / `input.required<T>()` — 컴포넌트 입력 (signal 기반)

**개념**: 부모로부터 받는 값을 signal로 노출.

**프로젝트 예시** — [apps/admin/src/app/components/page-header/page-header.component.ts](apps/admin/src/app/components/page-header/page-header.component.ts):
```ts
export class PageHeaderComponent {
    title = input.required<string>();
}
```

[apps/admin/src/app/components/detail-view/detail-view.component.ts](apps/admin/src/app/components/detail-view/detail-view.component.ts):
```ts
export class DetailViewComponent {
    createdAt = input<string>('');
    updatedAt = input<string>('');
    backLink = input.required<string>();
}
```

### `output<T>()` — 컴포넌트 출력 (이벤트)

**개념**: 부모에게 이벤트를 발행. `.emit(value)`로 발행.

**프로젝트 예시** — [apps/admin/src/app/components/form-actions/form-actions.component.ts](apps/admin/src/app/components/form-actions/form-actions.component.ts):
```ts
export class FormActionsComponent {
    submitText = input<string>('등록하기');
    cancel = output<void>();
    submit = output<void>();

    onCancel(): void { this.cancel.emit(); }
    onSubmit(): void { this.submit.emit(); }
}
```

부모에서 사용:
```html
<app-form-actions (cancel)="goBack()" (submit)="onSubmit()" />
```

## 6.11 Reactive Forms — `FormGroup`, `FormControl`, `Validators`

**개념**: Angular의 강력한 폼 관리 도구. 폼 상태/검증을 코드로 다룸.

**프로젝트 예시** — [apps/admin/src/app/pages/faq/faq-form/faq-form.page.ts](apps/admin/src/app/pages/faq/faq-form/faq-form.page.ts):
```ts
form = new FormGroup({
    question: new FormControl('', {
        validators: [Validators.required],
        nonNullable: true,
    }),
    answer: new FormControl('', {
        validators: [Validators.required],
        nonNullable: true,
    })
});
```

[apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts](apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts):
```ts
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
            Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
        ],
        nonNullable: true,
    }),
});
```

**주요 메서드**:
- `form.invalid` — 검증 실패 여부
- `form.getRawValue()` — 모든 값 객체로 반환
- `form.patchValue({ ... })` — 일부 필드만 갱신
- `form.reset()` — 폼 초기화

## 6.12 Router — `Router`, `RouterLink`, `navigate()`

### 코드로 페이지 이동 — `Router.navigate()`

**프로젝트 예시** — [apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts](apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts):
```ts
this.router.navigate(['/dashboard']);
// 또는 동적 세그먼트
this.router.navigate(['/faq', faq.id]);  // → /faq/abc-123
```

### HTML에서 링크 — `routerLink`

**프로젝트 예시** — [apps/admin/src/app/pages/faq/faq.page.html](apps/admin/src/app/pages/faq/faq.page.html):
```html
<a routerLink="/faq/create">새 FAQ 등록</a>
```

## 6.13 `Location.back()` — 브라우저 뒤로가기

**프로젝트 예시** — [apps/admin/src/app/pages/faq/faq-form/faq-form.page.ts](apps/admin/src/app/pages/faq/faq-form/faq-form.page.ts):
```ts
private readonly location = inject(Location);

goBack(): void {
    this.location.back();
}
```

## 6.14 `ChangeDetectorRef.markForCheck()` — 변화 감지 강제

**개념**: 비동기 작업 결과로 데이터를 변경한 후, Angular에게 "다시 그리세요" 알려주는 메서드.

**왜 필요한가**: Zoneless 모드에서는 비동기 결과 후 자동 갱신이 안 됨. 명시적으로 알려야 함.

**프로젝트 예시** — [apps/admin/src/app/pages/event/event.page.ts](apps/admin/src/app/pages/event/event.page.ts):
```ts
async loadData(page: number): Promise<void> {
    const result = await this.api.invoke(eventControllerFindAll, { page, limit: 10 });
    this.events = result.items ?? [];
    this.pageInfo = result.pageInfo ?? null;
    this.cdr.markForCheck();  // ← signal이 아닌 일반 속성 변경 후 필요
}
```

## 6.15 CommonModule + Pipes

**개념**: `@if`, `@for` 같은 새 control flow는 import 없이 사용 가능하지만, `| date`, `| async` 같은 파이프는 CommonModule이 필요.

**프로젝트 예시** — [apps/admin/src/app/components/detail-meta/detail-meta.component.html](apps/admin/src/app/components/detail-meta/detail-meta.component.html):
```html
<span>{{ createdAt() | date:'yyyy.MM.dd HH:mm' }}</span>
```

## 6.16 Control Flow — `@if`, `@for`, `@empty`

**개념**: Angular 17+의 새로운 템플릿 제어 문법.

**프로젝트 예시** — [apps/admin/src/app/components/data-table/data-table.component.html](apps/admin/src/app/components/data-table/data-table.component.html):
```html
@for (item of items(); track $index; let i = $index) {
    <tr (click)="onRowClick(item)">
        <td>{{ getRowNumber(i) }}</td>
        @for (col of columns(); track col.field) {
            <td>
                @if (col.type === 'date') {
                    {{ getValue(item, col.field) | date: 'yyyy.MM.dd' }}
                } @else {
                    {{ getValue(item, col.field) }}
                }
            </td>
        }
    </tr>
} @empty {
    <tr>
        <td>등록된 데이터가 없습니다.</td>
    </tr>
}
```

| 문법 | 의미 |
| --- | --- |
| `@if (cond) { ... } @else { ... }` | 조건 분기 |
| `@for (item of list; track key) { ... }` | 반복 |
| `@empty { ... }` | 반복할 항목이 없을 때 |
| `let last = $last` | 마지막 항목 여부 |
| `let i = $index` | 현재 인덱스 |

## 6.17 Content Projection — `<ng-content>`, named slots

**개념**: 부모가 자식 요소를 컴포넌트의 특정 위치에 끼워넣는 패턴 (슬롯).

**프로젝트 예시 — Default slot** [apps/admin/src/app/components/detail-view/detail-view.component.html](apps/admin/src/app/components/detail-view/detail-view.component.html):
```html
<div class="border-t border-outline-variant pt-10">
    <ng-content />   <!-- 부모가 넣은 내용이 여기로 -->
</div>
```

사용:
```html
<app-detail-view ...>
    <div>{{ faq.answer }}</div>   <!-- ← 여기 내용이 ng-content 위치에 들어감 -->
</app-detail-view>
```

**프로젝트 예시 — Named slot** [apps/admin/src/app/components/page-header/page-header.component.html](apps/admin/src/app/components/page-header/page-header.component.html):
```html
<ng-content select="[slot=breadcrumb]" />
<div class="flex justify-between items-end mb-10">
    <div>
        <h2>{{ title() }}</h2>
        <ng-content select="[slot=description]" />
    </div>
    <div class="flex items-center gap-2">
        <ng-content select="[slot=actions]" />
    </div>
</div>
```

사용:
```html
<app-page-header title="FAQ 관리">
    <p slot="description">자주 묻는 질문을 관리합니다.</p>
    <a slot="actions" routerLink="/faq/create">새 FAQ 등록</a>
</app-page-header>
```

---

## 6.18 `CanActivateFn` — 함수형 라우트 가드

**개념**: 사용자가 특정 URL로 이동하려 할 때, **그 페이지에 접근할 자격이 있는지 판단**하는 함수입니다. `true`를 반환하면 페이지를 보여주고, `false`나 `UrlTree`를 반환하면 다른 페이지로 리다이렉트합니다.

**왜 필요한가**: 로그인하지 않은 사용자가 URL을 직접 입력해서 `/inquiry` 같은 보호된 페이지에 접근하는 것을 막아야 합니다. 매 페이지 컴포넌트에서 "로그인 했나?" 확인하는 것보다, 라우팅 단계에서 한 번에 처리하는 것이 깔끔합니다.

**사용 방법**: `CanActivateFn` 타입의 함수를 만들고, 라우트 설정의 `canActivate` 배열에 넣습니다.

**프로젝트 예시 — admin 가드** [apps/admin/src/app/guards/auth.guard.ts](apps/admin/src/app/guards/auth.guard.ts):
```ts
import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = () => {
// ↑ CanActivateFn 타입의 함수. Angular가 라우트 이동 전에 자동으로 호출합니다.
//   화살표 함수라서 class 없이 그냥 export 가능. 이것이 "함수형 가드".

    const authService = inject(AuthService);
    // ↑ inject()로 서비스 주입. 함수형 가드에서는 constructor 주입이 불가하므로 inject() 사용.

    const router = inject(Router);

    if (authService.isLoggedIn()) {
        return true;
        // ↑ 로그인 되어 있으면 페이지 접근 허용
    }

    router.navigate(['/']);
    return false;
    // ↑ 로그인 안 되어 있으면 루트('/')로 이동시키고, 현재 라우트 접근 차단
};

export const guestGuard: CanActivateFn = () => {
// ↑ authGuard의 반대 역할. "로그인 안 한 사람만" 접근 가능.
//   주로 로그인 페이지에 적용: 이미 로그인했으면 로그인 페이지 볼 필요 없으니까.

    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
        return true;
        // ↑ 로그인 안 한 상태 → 로그인 페이지 보여줌
    }

    router.navigate(['/dashboard']);
    return false;
    // ↑ 이미 로그인됨 → 대시보드로 강제 이동
};
```

**프로젝트 예시 — shop 가드 (SSR 대응)** [apps/shop/src/app/core/guards/auth.guard.ts](apps/shop/src/app/core/guards/auth.guard.ts):
```ts
export const authGuard: CanActivateFn = (route, state) => {
// ↑ route: 이동하려는 라우트 정보, state: 전체 라우터 상태 (현재 URL 등)

    const platformId = inject(PLATFORM_ID);
    if (!isPlatformBrowser(platformId)) return true;
    // ↑ 핵심! SSR(서버 사이드 렌더링)에서는 localStorage가 없어서
    //   isLoggedIn 체크가 무조건 false가 됩니다.
    //   SSR에서는 가드를 통과시키고, 실제 인증 체크는 브라우저에서만 합니다.

    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn) return true;

    return router.createUrlTree(['/sign-in'], {
        queryParams: { returnUrl: state.url }
        // ↑ /sign-in?returnUrl=/inquiry 형태로 이동.
        //   로그인 성공 후 returnUrl을 읽어서 원래 가려던 페이지로 돌아갈 수 있음.
    });
};
```

**라우트에 가드 적용** — [apps/shop/src/app/app.routes.ts](apps/shop/src/app/app.routes.ts):
```ts
{
    path: 'inquiry',
    canActivate: [authGuard],
    // ↑ 이 배열에 가드를 넣으면 'inquiry' 페이지 이동 전에 authGuard가 실행됨.
    //   여러 가드를 넣을 수 있음: canActivate: [authGuard, adminGuard]
    //   모든 가드가 true를 반환해야 페이지 접근 가능.
    loadComponent: () => import('./pages/inquiry/inquiry.page'),
},
```

## 6.19 `HttpInterceptorFn` — 함수형 HTTP 인터셉터

**개념**: Angular에서 나가는 **모든 HTTP 요청**을 가로채서 공통 처리를 하고, 들어오는 **모든 HTTP 응답**도 가로채서 에러 처리를 하는 미들웨어입니다.

**왜 필요한가**: 로그인 후 서버에 요청할 때마다 `Authorization: Bearer xxx` 헤더를 수동으로 붙이면, 모든 API 호출 코드에서 반복됩니다. 인터셉터를 한 번 등록하면 모든 요청에 자동으로 토큰이 첨부됩니다. 또한 401 에러가 오면 자동 로그아웃 처리도 할 수 있습니다.

**동작 흐름**:
```
API 호출 → 인터셉터(토큰 첨부) → 서버 → 응답 → 인터셉터(에러 체크) → 컴포넌트
```

**프로젝트 예시** — [apps/admin/src/app/interceptors/auth.interceptor.ts](apps/admin/src/app/interceptors/auth.interceptor.ts):
```ts
import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { catchError, throwError } from "rxjs";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
// ↑ req: 원본 HTTP 요청 객체 (URL, 헤더, 바디 등)
//   next: 다음 단계로 요청을 전달하는 함수 (실제 서버로 보냄)

    const authService = inject(AuthService);
    const router = inject(Router);
    const token = authService.getToken();
    // ↑ localStorage에서 Access Token을 가져옴

    if (token) {
        req = req.clone({
        // ↑ clone(): HTTP 요청 객체는 불변(immutable)이라 직접 수정 불가.
        //   복제본을 만들어서 헤더를 추가합니다.
            setHeaders: {
                Authorization: `Bearer ${token}`,
                // ↑ 모든 API 요청에 "Authorization: Bearer eyJ..." 헤더 자동 추가.
                //   서버의 JwtStrategy가 이 헤더에서 토큰을 추출합니다.
            },
            withCredentials: true,
            // ↑ 쿠키(Refresh Token)도 함께 전송하라는 설정.
            //   이것이 없으면 httpOnly 쿠키가 서버로 전송되지 않습니다.
        });
    } else {
        req = req.clone({ withCredentials: true });
        // ↑ 토큰이 없어도 쿠키는 전송 (로그인 전 refresh 시도 등)
    }

    return next(req).pipe(
    // ↑ next(req): 요청을 서버로 보냄. 반환값은 Observable<HttpEvent>.
    //   .pipe(): RxJS의 파이프라인. 응답을 가로채서 처리할 수 있음.

        catchError(error => {
        // ↑ catchError: 서버 응답이 에러(4xx, 5xx)일 때 실행되는 핸들러.

            if (error.status === 401 && !req.url.includes('/signin') && !req.url.includes('/refresh')) {
            // ↑ 401 Unauthorized = 토큰 만료 또는 무효.
            //   단, 로그인 API(/signin)와 토큰 갱신 API(/refresh)의 401은 무시.
            //   (로그인 실패는 정상적인 401이므로 로그아웃 처리하면 안 됨)

                authService.clear();
                // ↑ localStorage에서 토큰과 사용자 정보 삭제

                router.navigate(['/']);
                // ↑ 로그인 페이지로 이동
            }
            return throwError(() => error);
            // ↑ 에러를 다시 던져서 호출한 쪽(컴포넌트)에서도 catch할 수 있게 함
        }),
    );
};
```

**인터셉터 등록** — [apps/admin/src/app/app.config.ts](apps/admin/src/app/app.config.ts):
```ts
export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        // ↑ withInterceptors(): 함수형 인터셉터 배열을 등록.
        //   여러 인터셉터를 넣으면 배열 순서대로 실행됨.
        //   예: withInterceptors([loggingInterceptor, authInterceptor])
    ],
};
```

## 6.20 SSR — `isPlatformBrowser`, `PLATFORM_ID`

**개념**: Angular의 서버 사이드 렌더링(SSR)은 서버(Node.js)에서 HTML을 미리 그려서 클라이언트에 보내는 기술입니다. 이때 서버에는 `window`, `localStorage`, `document`, `navigator` 같은 **브라우저 전용 객체가 존재하지 않아서** 에러가 발생합니다. `isPlatformBrowser()`로 "지금 브라우저인가?"를 확인하여 분기합니다.

**왜 필요한가**: shop 앱은 SSR을 사용합니다. SSR의 장점(빠른 첫 로딩, SEO)을 누리면서도, 브라우저 전용 코드(`localStorage`, `window.location`, `document.cookie`)가 서버에서 실행되지 않도록 방어해야 합니다.

**SSR 동작 원리**:
1. 사용자가 URL 입력 → 서버(Node.js)가 Angular 앱을 실행하여 HTML 생성 (SSR)
2. 이 HTML을 클라이언트에 전송 → 사용자는 즉시 화면을 봄 (빠른 첫 로딩)
3. 클라이언트에서 JavaScript가 로드되면 Angular가 기존 HTML을 "인수인계" 받음 (하이드레이션)
4. 이후는 일반 SPA처럼 클라이언트에서 동작

**프로젝트 예시 — 카카오 콜백 페이지** [apps/shop/src/app/pages/auth/kakao-callback.page.ts](apps/shop/src/app/pages/auth/kakao-callback.page.ts):
```ts
import { isPlatformBrowser } from '@angular/common';
// ↑ Angular이 제공하는 플랫폼 판별 함수

import { PLATFORM_ID } from '@angular/core';
// ↑ 현재 플랫폼 정보를 담고 있는 DI 토큰
//   브라우저면 'browser', 서버면 'server' 값

private readonly platformId = inject(PLATFORM_ID);
// ↑ DI로 현재 플랫폼 ID를 주입받음

async ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    // ↑ 서버에서 실행 중이면 아무것도 하지 않고 리턴.
    //   서버에서는 카카오 콜백 처리를 할 수 없음 (window, localStorage 없음).

    const code = this.route.snapshot.queryParams['code'];
    // ↑ 카카오가 리다이렉트하면서 붙여준 인가 코드를 URL에서 추출

    if (code) {
        await this.authService.kakaoLogin(code);
        // ↑ 서버로 인가 코드 전송 → JWT 받기 → localStorage 저장
    }
}
```

**프로젝트 예시 — AuthService에서 SSR 방어** [apps/shop/src/app/shared/services/auth.service.ts](apps/shop/src/app/shared/services/auth.service.ts):
```ts
get isLoggedIn(): boolean {
    if (typeof window === 'undefined') return false;
    // ↑ typeof 체크 방식: window 자체가 없으면 접근만 해도 ReferenceError.
    //   typeof는 존재하지 않는 변수도 안전하게 'undefined' 반환.
    //   SSR(Node.js)에서는 window가 없으므로 false 반환.

    return localStorage.getItem('access_token') !== null;
    // ↑ 브라우저에서만 실행됨. localStorage에 토큰이 있으면 로그인 상태.
}

logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/sign-in';
    // ↑ window.location도 SSR에서는 없으므로 방어 필요.
}
```

**SSR 방어가 필요한 API 목록**:
| 브라우저 전용 API | SSR에서의 상태 | 방어 방법 |
| --- | --- | --- |
| `window` | ❌ 존재하지 않음 | `typeof window === 'undefined'` |
| `localStorage` | ❌ 존재하지 않음 | `typeof window === 'undefined'` 후 접근 |
| `document` | ❌ 존재하지 않음 | `isPlatformBrowser()` |
| `navigator` | ❌ 존재하지 않음 | `isPlatformBrowser()` |
| `window.location.href` | ❌ 존재하지 않음 | `typeof window === 'undefined'` |
| `fetch()` (상대경로) | ⚠️ base URL 없음 | `isPlatformBrowser()` 후 호출 |

---

# 7. TypeScript / JavaScript 핵심 문법

## 7.1 `async` / `await` / `Promise`

**개념**: 비동기 작업을 동기 코드처럼 작성하는 도구.

**Promise의 3가지 상태**:
- `pending` — 진행 중
- `fulfilled` — 성공
- `rejected` — 실패

**프로젝트 예시** — [apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts](apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts):
```ts
async submit() {
    if (this.form.invalid) return;
    const values = this.form.getRawValue();

    try {
        const user = await this.api.invoke(adminControllerSignin, {
            body: { email: values.email, password: values.password },
        });
        this.adminStore.setUser(user);
        this.router.navigate(['/dashboard']);
    } catch (error: any) {
        this.errorMessage = error?.error?.message || '로그인에 실패했습니다.';
    }
}
```

## 7.2 `Promise.all([...])` — 병렬 처리

**개념**: 여러 비동기 작업을 동시에 실행해 모두 끝나면 결과 배열을 받음.

**왜 필요한가**: 두 작업이 서로 의존하지 않으면 직렬보다 병렬이 훨씬 빠름.

**프로젝트 예시** — [apps/server/src/app/event/event.service.ts](apps/server/src/app/event/event.service.ts):
```ts
const [items, totalItems] = await Promise.all([
    this.prisma.event.findMany({ where, orderBy, skip, take: limit }),
    this.prisma.event.count({ where }),
]);
```

→ findMany와 count가 동시에 실행됨. 직렬보다 ~2배 빠름.

## 7.3 `try` / `catch` — 예외 처리

**개념**: try 블록의 에러를 catch에서 잡아 처리.

**프로젝트 예시** — [apps/admin/src/app/pages/notice/notice-detail/notice-detail.page.ts](apps/admin/src/app/pages/notice/notice-detail/notice-detail.page.ts):
```ts
async onDelete() {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
        await this.api.invoke(noticeControllerRemove, { id: this.notice!.id });
        this.router.navigate(['/notice']);
    } catch (error) {
        console.error('공지사항 삭제 실패', error);
    }
}
```

## 7.4 `extends` / `implements` / `super()`

| 키워드 | 용도 |
| --- | --- |
| `extends` | 클래스 상속 (부모의 구현 물려받음, 1개만 가능) |
| `implements` | 인터페이스 약속 (메서드 시그니처만, 여러 개 가능) |
| `super()` | 부모 클래스 생성자 호출 (extends 사용 시 필수) |

**프로젝트 예시** — [apps/server/src/prisma/prisma.service.ts](apps/server/src/prisma/prisma.service.ts):
```ts
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
        super({ adapter });   // ← PrismaClient의 생성자 호출
    }

    async onModuleInit() {        // ← implements OnModuleInit 약속을 지킴
        await this.$connect();
    }
}
```

## 7.5 구조 분해 할당 (Destructuring)

**개념**: 객체/배열에서 원하는 값을 한 번에 꺼내 변수로 만들기.

**프로젝트 예시** — [apps/server/src/app/admin/admin.service.ts](apps/server/src/app/admin/admin.service.ts):
```ts
const { email, password } = data;   // data.email, data.password 한번에 꺼냄
```

[apps/server/src/app/admin/admin.listener.ts](apps/server/src/app/admin/admin.listener.ts):
```ts
async handleAdminLoggedInEvent(payload: { admin: Admin }) {
    const { admin } = payload;
    // ...
}
```

**배열 분해** — [apps/server/src/app/event/event.service.ts](apps/server/src/app/event/event.service.ts):
```ts
const [items, totalItems] = await Promise.all([ ... ]);
```

## 7.6 Spread Operator (`...`)

**개념**: 객체/배열을 펼치거나 합치는 연산자.

**프로젝트 예시** — [apps/admin/src/app/stores/admin.store.ts](apps/admin/src/app/stores/admin.store.ts):
```ts
this.state.update(s => ({ ...s, user }));   // 기존 state 복사 + user만 교체
```

## 7.7 Optional Chaining (`?.`)

**개념**: 중간 값이 null/undefined면 에러 없이 undefined를 반환.

**프로젝트 예시** — [apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts](apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts):
```ts
this.errorMessage = error?.error?.message || '로그인에 실패했습니다.';
//                       ↑ error가 undefined면 그냥 undefined 반환, 에러 X
```

## 7.8 Non-null Assertion (`!`)

**개념**: "이 값은 절대 null/undefined가 아니다"라고 TypeScript에게 단언.

**프로젝트 예시** — [apps/server/src/prisma/prisma.service.ts](apps/server/src/prisma/prisma.service.ts):
```ts
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!  // ← .env에 반드시 있다고 단언
});
```

[apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.ts](apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.ts):
```ts
await this.api.invoke(faqControllerRemove, {
    id: this.faq!.id,   // ← faq가 null이 아님을 단언
});
```

**위험**: 실제로 null이면 런타임 크래시 → 신중하게 사용.

## 7.9 Nullish Coalescing (`??`)

**개념**: 왼쪽 값이 `null`/`undefined`일 때만 오른쪽 값 사용. `||`보다 엄격.

**프로젝트 예시** — [apps/admin/src/app/pages/event/event.page.ts](apps/admin/src/app/pages/event/event.page.ts):
```ts
this.events = result.items ?? [];
this.pageInfo = result.pageInfo ?? null;
```

## 7.10 Generics `<T>`

**개념**: 타입을 매개변수처럼 받는 문법. 같은 구조를 다양한 타입에 재사용.

**프로젝트 예시** — [apps/server/src/libs/dtos/offset-pagination.dto.ts](apps/server/src/libs/dtos/offset-pagination.dto.ts):
```ts
export class OffsetPaginationDTO<T> {
    items: T[];
    pageInfo: PageInfoDTO;
}
```

사용 — [apps/server/src/app/event/event.controller.ts](apps/server/src/app/event/event.controller.ts):
```ts
async findAll(...): Promise<OffsetPaginationDTO<EventDTO>> { ... }
```

Angular signal에서도 — [apps/admin/src/app/components/page-header/page-header.component.ts](apps/admin/src/app/components/page-header/page-header.component.ts):
```ts
title = input.required<string>();
items = input.required<Breadcrumb[]>();
```

## 7.11 `interface` 정의

**프로젝트 예시** — [apps/admin/src/app/components/breadcrumb/breadcrumb.component.ts](apps/admin/src/app/components/breadcrumb/breadcrumb.component.ts):
```ts
export interface Breadcrumb {
    label: string;
    link?: string;   // 옵션 필드 (있어도 되고 없어도 됨)
}
```

[apps/admin/src/app/components/data-table/data-table.types.ts](apps/admin/src/app/components/data-table/data-table.types.ts):
```ts
export interface ColumnDef {
    field: string;
    name: string;
    type?: 'text' | 'date' | 'number';   // 리터럴 타입의 union
    dateFormat?: string;
    truncate?: boolean;
    width?: string;
}
```

## 7.12 Getter

**개념**: 호출 시점에 계산되는 읽기 전용 속성. 일반 메서드(`func()`) 호출이 아닌 속성(`obj.prop`) 접근으로 사용.

**프로젝트 예시** — [apps/admin/src/app/pages/faq/faq-form/faq-form.page.ts](apps/admin/src/app/pages/faq/faq-form/faq-form.page.ts):
```ts
get isEditMode() { return !!this.id(); }

// HTML에서: {{ isEditMode }} 또는 [class.active]="isEditMode" 식으로 사용
```

---

# 8. 외부 라이브러리

## 8.1 bcryptjs — `hashSync`, `compareSync`

**개념**: 비밀번호 해싱 라이브러리. 평문 비밀번호를 복원 불가한 해시로 변환.

| 함수 | 용도 |
| --- | --- |
| `hashSync(plain, rounds)` | 평문 → 해시 (저장할 때) |
| `compareSync(plain, hash)` | 평문 vs 해시 비교 (로그인할 때) |

`rounds` (보통 10~12)는 솔트 라운드 수. 높을수록 보안↑ 속도↓.

**프로젝트 예시 — 저장** [apps/server/src/app/admin/admin.module.ts](apps/server/src/app/admin/admin.module.ts):
```ts
await this.prisma.admin.create({
    data: {
        password: hashSync(this.defaultAdminPassword, 10),  // ← 해시로 저장
        // ...
    }
});
```

**예시 — 검증** [apps/server/src/app/admin/admin.service.ts](apps/server/src/app/admin/admin.service.ts):
```ts
const isPasswordValid = compareSync(password, admin.password);
//                                  ↑ 평문    ↑ DB의 해시
if (!isPasswordValid) throw new UnauthorizedException({ ... });
```

## 8.2 dotenv — `dotenv/config`, `process.env`

**개념**: `.env` 파일의 환경 변수를 `process.env`로 로드.

**프로젝트 예시** — [apps/server/src/main.ts](apps/server/src/main.ts) 최상단:
```ts
import 'dotenv/config';   // 부수효과 import: .env 파일을 process.env로 로드
```

**예시 — 사용** [apps/server/src/prisma/prisma.service.ts](apps/server/src/prisma/prisma.service.ts):
```ts
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!
});
```

[apps/server/src/app/admin/admin.module.ts](apps/server/src/app/admin/admin.module.ts):
```ts
private readonly defaultAdminEmail = process.env.DEFAULT_ADMIN_USERNAME || '';
private readonly defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || '';
```

## 8.3 ng-openapi-gen — `NgOpenApiGen`, `$RefParser`

**개념**: OpenAPI 스펙(JSON)을 Angular용 TypeScript 클라이언트로 자동 변환.

**효과**: 서버에서 컨트롤러를 만들면 자동으로 admin 앱에서 import해 쓸 수 있는 함수가 생김. 타입도 자동 동기화.

**프로젝트 예시** — [apps/server/src/main.ts](apps/server/src/main.ts):
```ts
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
```

→ 생성된 결과 사용 [apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.ts](apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.ts):
```ts
import { Api, faqControllerFindById, faqControllerRemove, FaqDto } from "@api-client";

this.faq = await this.api.invoke(faqControllerFindById, { id });
```

---

## 8.4 Supabase Storage — 이미지 업로드

**개념**: Supabase는 Firebase의 오픈소스 대안으로, Storage 기능을 사용하면 이미지/파일을 클라우드에 업로드하고 공개 URL을 받을 수 있습니다.

**왜 필요한가**: 서버 로컬에 이미지를 저장하면 서버 용량 부족, 서버 이전 시 이미지 유실 문제가 있습니다. 클라우드 스토리지를 쓰면 CDN으로 빠르게 제공되고, 서버와 독립적으로 관리됩니다.

**프로젝트 예시** — [apps/admin/src/app/services/supabase.service.ts](apps/admin/src/app/services/supabase.service.ts):
```ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: 'root' })
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,   // Supabase 프로젝트 URL
            environment.supabaseKey    // Supabase 공개 API 키 (anon key)
        );
        // ↑ createClient(): Supabase 클라이언트 인스턴스 생성.
        //   URL과 Key는 Supabase 대시보드 → Settings → API에서 확인.
    }

    async uploadImage(file: File, folder: string): Promise<string> {
        const fileExt = file.name.split('.').pop();
        // ↑ 'photo.jpg' → 'jpg' (확장자 추출)

        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        // ↑ 고유한 파일명 생성. 예: 'gallery/1715123456789-a1b2c3.jpg'
        //   Date.now(): 밀리초 타임스탬프 (중복 방지)
        //   Math.random().toString(36): 랜덤 문자열 (추가 유니크성)

        const { error } = await this.supabase.storage.from('uploads').upload(fileName, file);
        // ↑ 'uploads' 버킷에 파일 업로드. 버킷은 Supabase 대시보드에서 미리 생성.

        if (error) throw new Error(`이미지 업로드 실패: ${error.message}`);

        const { data } = this.supabase.storage.from('uploads').getPublicUrl(fileName);
        // ↑ 업로드된 파일의 공개 URL 생성.
        //   결과: 'https://xxx.supabase.co/storage/v1/object/public/uploads/gallery/...'

        return data.publicUrl;
        // ↑ 이 URL을 DB에 저장하고, 프론트에서 <img src="...">로 표시
    }
}
```

## 8.5 `@nestjs/passport` + `passport-jwt`

**개념**: NestJS에서 Passport 인증 전략을 사용하기 위한 공식 래퍼 패키지입니다. `passport-jwt`는 JWT 토큰 전용 전략입니다.

**왜 필요한가**: 인증 로직을 표준화된 방식으로 구현하고, `@UseGuards()`와 조합하여 선언적으로 API를 보호할 수 있습니다.

**사용하는 패키지들**:
| 패키지 | 역할 |
| --- | --- |
| `@nestjs/passport` | NestJS ↔ Passport 통합 (`PassportStrategy`, `AuthGuard`) |
| `@nestjs/jwt` | JWT 발급/검증 (`JwtModule`, `JwtService`) |
| `passport` | Passport 코어 라이브러리 |
| `passport-jwt` | JWT 인증 전략 (`Strategy`, `ExtractJwt`) |

**설치**: `pnpm add @nestjs/passport @nestjs/jwt passport passport-jwt`

→ 자세한 사용법은 위의 **1.16~1.18** 참고.

---

# 9. Infrastructure (Docker)

## 9.1 docker-compose.yml — PostgreSQL 컨테이너

**개념**: 여러 컨테이너를 한 번에 정의하고 실행하는 도구. 현재는 DB 하나만 운영.

**프로젝트 예시** — [docker/docker-compose.yml](docker/docker-compose.yml):
```yaml
services:
  database:
    image: postgres:18-alpine          # ← 사용할 이미지
    container_name: demo-db             # ← 컨테이너 이름
    restart: always                     # ← 재시작 정책 (장애 시 자동 재시작)
    environment:                        # ← 환경 변수
      POSTGRES_USER: demouser
      POSTGRES_PASSWORD: qwerasdf1234
      POSTGRES_DB: demodb
      TZ: Asia/Seoul
      PGDATA: /data/pgdata

    volumes:
      - demo_database_volume:/data      # ← 데이터 영속화

    ports:
      - "5432:5432"                     # ← 호스트:컨테이너 포트 매핑

volumes:
  demo_database_volume:
```

| 키워드 | 의미 |
| --- | --- |
| `image` | 사용할 도커 이미지 |
| `container_name` | 컨테이너 이름 (docker ps 등에서 사용) |
| `restart: always` | 컨테이너가 죽으면 자동 재시작 |
| `environment` | 컨테이너 내 환경 변수 |
| `volumes` | 데이터 영속화 (컨테이너 삭제돼도 데이터 유지) |
| `ports` | 호스트와 컨테이너 포트 매핑 |

## 9.2 자주 쓰는 도커 명령

```bash
# DB 컨테이너 시작
docker-compose -f docker/docker-compose.yml up -d

# 상태 확인
docker-compose -f docker/docker-compose.yml ps

# 로그 확인
docker-compose -f docker/docker-compose.yml logs database

# 컨테이너 중지
docker-compose -f docker/docker-compose.yml down

# 볼륨까지 삭제 (DB 데이터 초기화 — 주의)
docker-compose -f docker/docker-compose.yml down -v
```

---

# 10. 학습 순서 추천

전체 흐름을 한 번에 파악하려면 다음 순서로 코드를 읽어보세요.

## Backend — 관리자 서버 (apps/server)

1. **[main.ts](apps/server/src/main.ts)** — 서버 시동 + 전역 설정
2. **[app.module.ts](apps/server/src/app/app.module.ts)** — 모듈 조립
3. **[prisma.module.ts](apps/server/src/prisma/prisma.module.ts)** + **[prisma.service.ts](apps/server/src/prisma/prisma.service.ts)** — DB 인프라
4. **한 도메인 전체 사이클**:
   - [admin.module.ts](apps/server/src/app/admin/admin.module.ts)
   - [admin.controller.ts](apps/server/src/app/admin/admin.controller.ts)
   - [admin.service.ts](apps/server/src/app/admin/admin.service.ts)
5. **DTO 양쪽**:
   - [admin-sign-in.dto.ts](apps/server/src/app/admin/dtos/admin-sign-in.dto.ts) (요청)
   - [admin.dto.ts](apps/server/src/app/admin/dtos/admin.dto.ts) (응답)
6. **이벤트**: [admin.const.ts](apps/server/src/app/admin/admin.const.ts) + [admin.listener.ts](apps/server/src/app/admin/admin.listener.ts)
7. **페이지네이션 패턴**: [event.service.ts](apps/server/src/app/event/event.service.ts) + [libs/dtos/](apps/server/src/libs/dtos/)

## Backend — 사용자 서버 (apps/server-shop)

1. **[main.ts](apps/server-shop/src/main.ts)** — 서버 시동 + Swagger + API 클라이언트 생성
2. **[member.module.ts](apps/server-shop/src/app/member/member.module.ts)** — JWT + Passport 모듈 등록
3. **JWT 인증 전체 사이클**:
   - [jwt.strategy.ts](apps/server-shop/src/app/member/strategies/jwt.strategy.ts) (토큰 검증 전략)
   - [jwt-auth.guard.ts](apps/server-shop/src/app/member/guards/jwt-auth.guard.ts) (가드)
   - [member.controller.ts](apps/server-shop/src/app/member/member.controller.ts) (로그인/회원가입 API)
   - [member.service.ts](apps/server-shop/src/app/member/member.service.ts) (비즈니스 로직)
4. **카카오 OAuth**:
   - [kakao.interface.ts](apps/server-shop/src/app/member/interfaces/kakao.interface.ts) (타입 정의)
   - [kakao-auth.controller.ts](apps/server-shop/src/app/member/kakao-auth.controller.ts) (API 엔드포인트)
   - [kakao-auth.service.ts](apps/server-shop/src/app/member/kakao-auth.service.ts) (토큰 교환 + 회원 처리)
5. **인증 필요한 도메인**: [inquiry.controller.ts](apps/server-shop/src/app/inquiry/inquiry.controller.ts) (`@UseGuards(JwtAuthGuard)`)

## Frontend — 관리자 (apps/admin)

1. **[main.ts](apps/admin/src/main.ts)** — 부트스트랩
2. **[app.config.ts](apps/admin/src/app/app.config.ts)** — 전역 설정 (`withInterceptors`)
3. **[app.routes.ts](apps/admin/src/app/app.routes.ts)** — 라우팅 (`canActivate`)
4. **인증 흐름**:
   - [auth.guard.ts](apps/admin/src/app/guards/auth.guard.ts) (authGuard + guestGuard)
   - [auth.interceptor.ts](apps/admin/src/app/interceptors/auth.interceptor.ts) (토큰 자동 첨부)
5. **레이아웃**: [default/layout.component.ts](apps/admin/src/app/layout/default/layout.component.ts)
6. **컴포넌트 패턴 (단순→복잡)**:
   - [sign-in.page.ts](apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts) (입력 폼)
   - [faq-detail.page.ts](apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.ts) (조회 + redirect)
   - [event.page.ts](apps/admin/src/app/pages/event/event.page.ts) (목록 + 페이지네이션)
7. **상태 공유**: [admin.store.ts](apps/admin/src/app/stores/admin.store.ts)
8. **공통 컴포넌트들**: `apps/admin/src/app/components/` ([README.md](apps/admin/src/app/components/README.md) 참고)

## Frontend — 사용자 (apps/shop)

1. **[app.config.ts](apps/shop/src/app/app.config.ts)** — SSR + 프록시 설정
2. **[app.routes.ts](apps/shop/src/app/app.routes.ts)** — 라우팅 (인증 가드 적용)
3. **인증 흐름**:
   - [auth.service.ts](apps/shop/src/app/shared/services/auth.service.ts) (로그인/로그아웃/카카오)
   - [auth.guard.ts](apps/shop/src/app/core/guards/auth.guard.ts) (SSR 대응 가드)
4. **카카오 로그인**:
   - [sign-in.page.ts](apps/shop/src/app/pages/sign-in/sign-in.page.ts) (`onKakaoLogin`)
   - [kakao-callback.page.ts](apps/shop/src/app/pages/auth/kakao-callback.page.ts) (콜백 처리)
5. **SSR 패턴**: `isPlatformBrowser` 사용 예시들
6. **페이지 패턴 (단순→복잡)**:
   - [home.page.ts](apps/shop/src/app/pages/home/home.page.ts) (홈)
   - [notice-detail.page.ts](apps/shop/src/app/pages/notice/notice-detail/notice-detail.page.ts) (상세)
   - [inquiry.page.ts](apps/shop/src/app/pages/inquiry/inquiry.page.ts) (인증 필요 목록)

## 통합 흐름 이해

### 관리자 사이클
서버(`apps/server`)를 수정하면 → ng-openapi-gen이 자동으로 `libs/api-client/` 코드 생성 → admin이 그 함수를 import해서 호출 → 서버가 응답 → admin이 화면에 표시.

### 사용자 사이클
서버(`apps/server-shop`)를 수정하면 → ng-openapi-gen이 자동으로 `libs/api-client-shop/` 코드 생성 → shop이 그 함수를 import해서 호출.

### 카카오 OAuth 사이클
shop의 `onKakaoLogin()` → 카카오 서버 → 콜백 페이지 → `authService.kakaoLogin(code)` → 서버의 `POST /api/auth/kakao` → `handleKakaoLogin()` → DB 회원 처리 → JWT 발급 → shop이 localStorage에 저장 → 홈으로 이동.
