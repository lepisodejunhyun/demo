# 프로젝트 학습 가이드

이 문서는 이 프로젝트(`demo`)에서 실제로 사용된 함수, 데코레이터, API를 정리한 학습 자료입니다.
각 항목마다 **개념 → 왜 필요한가 → 사용 방법 → 프로젝트의 실제 코드 예시** 순으로 정리합니다.

## 프로젝트 구성 개요

| 영역 | 기술 스택 | 위치 |
| --- | --- | --- |
| 서버 (Backend API) | NestJS + Prisma + PostgreSQL | `apps/server/` |
| 관리자 (Frontend) | Angular 21 (standalone, zoneless) | `apps/admin/` |
| 데이터베이스 스키마 | Prisma | `prisma/` |
| 컨테이너 인프라 | Docker Compose | `docker/` |
| 자동 생성 API 클라이언트 | ng-openapi-gen | `libs/api-client/` |

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

# 2. Swagger (API 문서)

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

## Backend 사이클 (NestJS)

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

## Frontend 사이클 (Angular)

1. **[main.ts](apps/admin/src/main.ts)** — 부트스트랩
2. **[app.config.ts](apps/admin/src/app/app.config.ts)** — 전역 설정
3. **[app.routes.ts](apps/admin/src/app/app.routes.ts)** — 라우팅
4. **레이아웃**: [default/layout.component.ts](apps/admin/src/app/layout/default/layout.component.ts)
5. **컴포넌트 패턴 (단순→복잡)**:
   - [sign-in.page.ts](apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts) (입력 폼)
   - [faq-detail.page.ts](apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.ts) (조회 + redirect)
   - [event.page.ts](apps/admin/src/app/pages/event/event.page.ts) (목록 + 페이지네이션)
6. **상태 공유**: [admin.store.ts](apps/admin/src/app/stores/admin.store.ts)
7. **공통 컴포넌트들**: `apps/admin/src/app/components/` ([README.md](apps/admin/src/app/components/README.md) 참고)

## 통합 흐름 이해

서버를 수정하면 → ng-openapi-gen이 자동으로 클라이언트 코드 생성 → admin이 그 함수를 import해서 호출 → 서버가 응답 → admin이 화면에 표시.

이 사이클을 [server/main.ts:generateApiClient](apps/server/src/main.ts) ↔ [admin/sign-in.page.ts](apps/admin/src/app/pages/auth/sign-in/sign-in.page.ts) 의 `api.invoke(adminControllerSignin, ...)` 사용 방식을 비교하며 따라가보면 전체 그림이 잡힙니다.
