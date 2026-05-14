# 데코레이터(Decorators) — "클래스/메서드에 기능을 붙이는 방법"

---

## 데코레이터란?

데코레이터는 클래스, 메서드, 속성 위에 `@이름` 형태로 붙이는 특별한 문법이에요.

"이 클래스/메서드에 이런 기능을 추가해줘"라고 TypeScript에게 알려주는 방식이에요.

```typescript
// @Injectable() — "이 클래스는 NestJS 의존성 주입 시스템에 등록해줘"
@Injectable()
export class AdminService {
  // @Get() — "이 메서드는 GET HTTP 요청을 처리해줘"
  @Get()
  findAll() {
    return [];
  }
}
```

데코레이터는 말 그대로 **장식(decorate)**이에요. 기존 코드에 기능을 덧붙이는 거예요.

---

## 이 프로젝트에서 사용하는 데코레이터들

### NestJS 데코레이터

#### 클래스 데코레이터

```typescript
// @Module() — NestJS 모듈 선언
@Module({
  imports: [AdminModule, PrismaModule],
})
export class AppModule {}

// @Injectable() — 의존성 주입 가능하게
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}
}

// @Controller() — HTTP 컨트롤러 선언
@Controller('admins')  // 기본 경로: /admins
export class AdminController {}

// @Global() — 모듈을 전역으로 등록 (import 없이 어디서나 사용)
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

#### 메서드 데코레이터 (HTTP 라우팅)

```typescript
@Controller('admins')
export class AdminController {
  @Get()            // GET /admins
  findAll() {}

  @Get(':id')       // GET /admins/:id
  findOne(@Param('id') id: string) {}

  @Post()           // POST /admins
  create() {}

  @Post('signin')   // POST /admins/signin
  signIn() {}

  @Put(':id')       // PUT /admins/:id
  update() {}

  @Delete(':id')    // DELETE /admins/:id
  remove() {}

  @Patch(':id')     // PATCH /admins/:id
  partialUpdate() {}
}
```

#### 매개변수 데코레이터

```typescript
@Post('signin')
signIn(
  @Body() data: AdminSignInDTO,        // 요청 body 전체
  @Param('id') id: string,             // URL 파라미터
  @Query('page') page: number,         // 쿼리 스트링 (?page=1)
  @Headers('authorization') token: string,  // 요청 헤더
) {}
```

### Swagger 데코레이터

```typescript
@ApiTags('admins')  // Swagger UI에서 admins 그룹으로 묶음
@Controller('admins')
export class AdminController {

  @ApiOperation({ summary: '관리자 목록 조회' })  // 엔드포인트 설명
  @ApiResponse({ status: 200, type: [AdminDTO] }) // 응답 타입 명시
  @Get()
  findAll() {}

  @ApiProperty({ description: '관리자 이메일' })  // DTO 속성 설명
  // (DTO 클래스 속성 위에 사용)
}
```

### class-validator 데코레이터

```typescript
export class AdminSignInDTO {
  @IsEmail()                              // 이메일 형식 검사
  @IsNotEmpty()                           // 빈 값 불허
  email: string;

  @IsString()                             // string 타입 검사
  @MinLength(8)                           // 최소 8자
  @MaxLength(20)                          // 최대 20자
  @Matches(/^(?=.*[!@#$%^&*])/, {
    message: '특수문자를 포함해야 합니다'
  })
  password: string;
}
```

### class-transformer 데코레이터

```typescript
@Exclude()  // 이 클래스의 모든 속성은 기본적으로 숨김
export class AdminDTO {
  @Expose()   // 이 속성만 노출
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  // password는 @Expose()가 없으므로 → 응답에서 자동 제외됨
  password: string;
}
```

---

## Angular 데코레이터

### 컴포넌트 데코레이터

```typescript
@Component({
  selector: 'app-root',          // HTML 태그 이름
  standalone: true,              // 독립 컴포넌트
  imports: [RouterOutlet],       // 사용할 모듈/컴포넌트
  templateUrl: './app.html',     // HTML 파일 경로
  styleUrl: './app.css',         // CSS 파일 경로
})
export class App {
  title = 'admin';
}
```

### 서비스 데코레이터

```typescript
@Injectable({
  providedIn: 'root',  // 앱 전체에서 하나의 인스턴스만 (싱글톤)
})
export class AdminStore {
  readonly user = signal<AdminDto | null>(null);
}
```

---

## 데코레이터 작동 원리 (이해용)

데코레이터는 실제로 **함수**예요. 클래스나 메서드를 인수로 받아서 무언가를 추가하거나 변환해요.

```typescript
// @Injectable()의 단순화된 내부 동작
function Injectable() {
  return function(target: Function) {
    // target = 데코레이터를 붙인 클래스
    // NestJS 내부 메타데이터에 등록
    Reflect.defineMetadata('injectable', true, target);
  };
}

// @Get()의 단순화된 내부 동작
function Get(path?: string) {
  return function(target: any, propertyKey: string) {
    // propertyKey = 메서드 이름
    // NestJS 내부 라우트 테이블에 등록
    Reflect.defineMetadata('method', 'GET', target, propertyKey);
    Reflect.defineMetadata('path', path || '', target, propertyKey);
  };
}
```

실제 구현은 훨씬 복잡하지만, 핵심은 **함수가 클래스/메서드의 정보를 받아서 처리하는 것**이에요.

---

## tsconfig.json에서 데코레이터 활성화

TypeScript에서 데코레이터를 사용하려면 설정이 필요해요.

```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,  // 데코레이터 활성화
    "emitDecoratorMetadata": true,   // 메타데이터 반영
  }
}
```

NestJS 프로젝트는 이 설정이 기본으로 되어 있어요.

---

## 데코레이터 종류 정리

| 데코레이터 종류 | 위치 | 예시 |
|----------------|------|------|
| 클래스 데코레이터 | 클래스 위 | `@Injectable()`, `@Module()` |
| 메서드 데코레이터 | 메서드 위 | `@Get()`, `@Post()` |
| 속성 데코레이터 | 속성 위 | `@IsEmail()`, `@Expose()` |
| 매개변수 데코레이터 | 매개변수 앞 | `@Body()`, `@Param()` |

---

## 이 프로젝트 데코레이터 흐름

```text
[클래스 선언]
  @Injectable()  ← NestJS: "의존성 주입 가능"
  @Controller('admins')  ← NestJS: "HTTP /admins 경로"

[메서드 선언]
  @Post('signin')  ← NestJS: "POST /admins/signin"
  @ApiOperation({ summary: '로그인' })  ← Swagger: 문서 생성

[매개변수 선언]
  @Body() data: AdminSignInDTO  ← NestJS: "요청 body를 AdminSignInDTO로 파싱"

[DTO 속성]
  @IsEmail()  ← class-validator: "유효성 검사"
  @ApiProperty()  ← Swagger: "타입 문서화"

[응답 DTO]
  @Exclude() 클래스  ← class-transformer: "기본 숨김"
  @Expose() 속성  ← class-transformer: "이 속성만 노출"
```

---

## 정리

```
데코레이터 = @이름 형태로 클래스/메서드/속성에 기능을 추가하는 문법

NestJS:    @Injectable, @Module, @Controller, @Get, @Post, @Body, @Param
Swagger:   @ApiTags, @ApiOperation, @ApiProperty
Validator: @IsEmail, @MinLength, @Matches
Transform: @Exclude, @Expose
Angular:   @Component, @Injectable

사용하는 곳에 붙이면 프레임워크가 알아서 처리해줘요.
직접 구현할 필요 없이 갖다 쓰기만 하면 됩니다.
```
