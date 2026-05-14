# 클래스와 접근 제한자 — `public`, `private`, `protected`, `readonly`

---

## 왜 접근 제한자가 필요한가?

클래스는 데이터와 그 데이터를 다루는 함수를 하나로 묶는 것이에요.

그런데 클래스 안의 모든 것을 외부에서 마음대로 건드릴 수 있으면 문제가 생겨요.

```typescript
class BankAccount {
  balance = 0;  // 누구든 직접 변경 가능
}

const account = new BankAccount();
account.balance = 99999999;  // 마음대로 잔액 변경! 위험해요
```

접근 제한자는 "누가 이 속성/메서드에 접근할 수 있는지"를 제어해요.

---

## 1. `public` — 어디서든 접근 가능 (기본값)

```typescript
class AdminService {
  public name: string = "AdminService";

  public findAll() {
    return "모든 관리자 조회";
  }
}

const service = new AdminService();
service.name;     // OK! — 외부에서 접근 가능
service.findAll(); // OK! — 외부에서 호출 가능
```

`public`은 기본값이라 생략 가능해요. 대부분의 코드에서 명시하지 않아요.

---

## 2. `private` — 클래스 내부에서만 접근 가능

```typescript
class AdminService {
  private secretKey = "super-secret-123";

  private hashPassword(password: string): string {
    return `hashed_${password}`;  // 실제로는 bcrypt 사용
  }

  public createAdmin(name: string, password: string) {
    const hashedPassword = this.hashPassword(password);  // 내부에서는 OK!
    return { name, password: hashedPassword };
  }
}

const service = new AdminService();
service.secretKey;       // ← 에러! private — 외부 접근 불가
service.hashPassword("x"); // ← 에러! private — 외부 호출 불가
service.createAdmin("홍길동", "password123");  // OK! public
```

### 이 프로젝트에서 실제 사용 예

```typescript
// prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

// admin.service.ts
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}
  //          ^^^^^^^  ↑ private + readonly

  async findAll(): Promise<Admin[]> {
    return await this.prisma.admin.findMany({});  // 내부에서는 OK!
  }
}

const service = new AdminService(prisma);
service.prisma;  // ← 에러! private — 외부에서 접근 불가
```

---

## 3. `protected` — 클래스와 자식 클래스에서만 접근 가능

```typescript
class BaseService {
  protected logger(message: string): void {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

class AdminService extends BaseService {
  public findAll() {
    this.logger("findAll 호출됨");  // OK! 자식 클래스에서 접근 가능
    return [];
  }
}

const service = new AdminService();
service.logger("test");  // ← 에러! protected — 외부 접근 불가
```

---

## 4. `readonly` — 읽기만 가능, 수정 불가

```typescript
class Config {
  readonly databaseUrl: string;
  readonly port: number;

  constructor(url: string, port: number) {
    this.databaseUrl = url;  // 생성자에서만 할당 가능
    this.port = port;
  }
}

const config = new Config("postgresql://...", 3000);
config.databaseUrl;         // OK! — 읽기는 가능
config.databaseUrl = "..."; // ← 에러! readonly — 수정 불가
```

---

## 생성자 매개변수 단축 문법

TypeScript에는 생성자 매개변수에 접근 제한자를 붙이면 자동으로 속성이 만들어지는 편리한 문법이 있어요.

```typescript
// 일반적인 방식 (길어요)
class AdminService {
  private readonly prisma: PrismaService;
  private readonly eventEmitter: EventEmitter2;

  constructor(prisma: PrismaService, eventEmitter: EventEmitter2) {
    this.prisma = prisma;
    this.eventEmitter = eventEmitter;
  }
}

// 단축 문법 (이 프로젝트에서 실제 사용 방식)
class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  // this.prisma와 this.eventEmitter가 자동으로 생성됨!
}
```

이 단축 문법은 NestJS에서 의존성 주입할 때 항상 사용해요.

---

## NestJS에서의 접근 제한자 패턴

### 서비스 클래스 전형적인 구조

```typescript
// admin.service.ts
@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,       // 외부 노출 불필요
    private readonly eventEmitter: EventEmitter2, // 외부 노출 불필요
  ) {}

  // public — 컨트롤러에서 호출
  async findAll(): Promise<Admin[]> {
    return await this.prisma.admin.findMany({});
  }

  // public — 컨트롤러에서 호출
  async signIn(data: AdminSignInDTO): Promise<Admin> {
    const admin = await this.prisma.admin.findFirst({
      where: { email: data.email },
    });

    if (!admin) throw new UnauthorizedException('...');

    const isValid = this.validatePassword(data.password, admin.password);
    //              ↑ 내부 private 메서드 호출

    if (!isValid) throw new UnauthorizedException('...');

    return admin;
  }

  // private — 서비스 내부에서만 사용
  private validatePassword(input: string, hashed: string): boolean {
    return compareSync(input, hashed);
  }
}
```

### 컨트롤러는 public 메서드만 호출

```typescript
// admin.controller.ts
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  findAll() {
    return this.adminService.findAll();  // public이라 OK
  }

  @Post('signin')
  signIn(@Body() data: AdminSignInDTO) {
    return this.adminService.signIn(data);  // public이라 OK
  }
}
```

---

## PrismaService 상속 패턴

```typescript
// prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // PrismaClient의 모든 public 메서드 상속
  // admin, loginLog 등 모델 접근자도 상속됨

  async onModuleInit() {
    await this.$connect();  // PrismaClient의 public 메서드
  }
}

// 사용
const admins = await this.prisma.admin.findMany({});
// prisma.admin은 PrismaClient의 public 속성
```

---

## 접근 제한자 비교 요약

| 제한자 | 클래스 내부 | 자식 클래스 | 외부 |
|--------|------------|-------------|------|
| `public` | ✅ | ✅ | ✅ |
| `protected` | ✅ | ✅ | ❌ |
| `private` | ✅ | ❌ | ❌ |

| 키워드 | 설명 |
|--------|------|
| `readonly` | 초기화 후 수정 불가 (접근은 가능) |
| `static` | 인스턴스 없이 클래스에서 바로 접근 |
| `abstract` | 자식 클래스가 반드시 구현해야 함 |

---

## `static` — 인스턴스 없이 사용

```typescript
class MathUtils {
  static readonly PI = 3.14159;

  static circle(radius: number): number {
    return MathUtils.PI * radius * radius;
  }
}

// 인스턴스 생성 없이 바로 사용
const area = MathUtils.circle(5);
console.log(MathUtils.PI);
```

---

## 실전 가이드

```
NestJS 서비스의 의존성   → private readonly (외부에서 접근 불필요)
외부에 공개할 메서드     → public (또는 생략)
내부 헬퍼 메서드        → private (외부에 노출하지 않음)
환경 변수, 설정값        → private readonly (생성 후 변경 없음)
```
