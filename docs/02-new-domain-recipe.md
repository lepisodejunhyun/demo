# 새 도메인 추가 레시피 — "게시판" 처음부터 끝까지 만들기

이 문서는 이 프로젝트에 **새로운 도메인을 추가하는 방법**을 단계별로 안내합니다. 예시로 "게시판(Board)"을 만들어보면서, 어떤 파일을 어떤 순서로 만들고 무엇을 적어야 하는지 다룹니다.

> "도메인" = 하나의 주제(예: FAQ, 공지사항, 게시판). 보통 DB 테이블 하나 + 서버 API + 화면 페이지들이 한 세트.

---

## 큰 그림 — 만들어야 할 것들

게시판 도메인 하나를 추가하면 약 **15~20개의 파일**을 만들거나 수정합니다. 많아 보이지만 모두 정해진 패턴이에요. 한 번 익히면 다음번엔 30분이면 됩니다.

```
1단계 — DB 설계 (prisma 폴더)
   └─ board.prisma 파일

2단계 — 서버 (apps/server)
   ├─ board.module.ts
   ├─ board.controller.ts
   ├─ board.service.ts
   ├─ dtos/board.dto.ts (응답)
   ├─ dtos/board-create.dto.ts (요청)
   └─ app.module.ts에 BoardModule 추가

3단계 — 관리자 화면 (apps/admin)
   ├─ pages/board/board.page.ts + html (목록)
   ├─ pages/board/board-detail/board-detail.page.ts + html (상세)
   ├─ pages/board/board-form/board-form.page.ts + html (등록/수정)
   ├─ app.routes.ts에 라우트 추가
   └─ sidebar.component.ts에 메뉴 추가

4단계 — 동작 확인
```

---

## 1단계: DB 설계

### 1-1. prisma 모델 파일 만들기

**파일**: `prisma/board.prisma` (새로 만들기)

[기존 예시 — prisma/admin.prisma](../prisma/admin.prisma) 참고. 같은 패턴을 따라 게시판 모델 정의:

```prisma
model Board {
    id          String      @id     @default(uuid())
    title       String
    content     String
    authorName  String
    viewCount   Int         @default(0)
    createdAt   DateTime    @default(now())
    updatedAt   DateTime    @default(now()) @updatedAt
    deletedAt   DateTime?
}
```

### 각 부분 풀이

- **`model Board`**: PostgreSQL에 "Board"라는 이름의 테이블 생성. 모델 이름은 단수형(Board), 첫 글자 대문자가 관례.
- **`id String @id @default(uuid())`**: 기본키. uuid()로 랜덤 ID 자동 생성.
- **`title String`**: 제목. 필수값(빈 문자열 허용 안 됨, NULL 안 됨).
- **`content String`**: 내용. 길어도 OK (PostgreSQL의 String은 TEXT 타입으로 매핑돼서 제한 없음).
- **`authorName String`**: 작성자 이름. 실제 프로젝트에선 보통 Admin 테이블의 외래키를 쓰지만, 여기선 단순화.
- **`viewCount Int @default(0)`**: 조회수. 기본값 0.
- **`createdAt DateTime @default(now())`**: 생성 시각 자동 기록.
- **`updatedAt DateTime @default(now()) @updatedAt`**: 수정 시각. `@updatedAt`이 있으면 레코드 수정 시 자동 갱신.
- **`deletedAt DateTime?`**: Soft Delete용. `?`는 nullable. null이면 활성, 값 있으면 삭제됨.

### 비유

prisma 모델 파일 = "테이블 설계 도면". 도면을 그려야 DB가 그 모양으로 테이블을 만들어줍니다.

### 1-2. 마이그레이션 (Migration) 실행

설계 도면(.prisma)을 진짜 DB에 반영해야 합니다. 터미널에서:

```bash
pnpm prisma migrate dev --name add_board
```

> `migrate dev` = "내가 .prisma 파일을 바꿨으니 DB에도 반영해줘"
> `--name add_board` = 이 변경의 이름 (히스토리에 남음)

이 명령이 하는 일:
1. `.prisma` 파일과 현재 DB를 비교.
2. 차이를 SQL로 만들어서 DB에 실행 (`CREATE TABLE "Board" (...)`).
3. `prisma/migrations/` 폴더에 SQL 파일을 보관 (히스토리).
4. TypeScript 타입 자동 재생성 (`@prisma/client`).

### 1-3. 확인

DB GUI로 확인:
```bash
pnpm prisma studio
```

브라우저에서 prisma studio가 열림. Board 테이블이 보이면 성공.

---

## 2단계: 서버 (NestJS)

### 폴더 구조 만들기

`apps/server/src/app/board/` 폴더를 새로 만들고 그 안에:

```
board/
├── board.module.ts
├── board.controller.ts
├── board.service.ts
└── dtos/
    ├── board.dto.ts
    └── board-create.dto.ts
```

### 2-1. 응답 DTO — `board.dto.ts`

**파일**: `apps/server/src/app/board/dtos/board.dto.ts`

[기존 예시 — apps/server/src/app/admin/dtos/admin.dto.ts](../apps/server/src/app/admin/dtos/admin.dto.ts) 참고.

```ts
import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class BoardDTO {
    @ApiProperty({ description: '게시글 고유 식별자' })
    @Expose()
    id: string;

    @ApiProperty({ description: '게시글 제목' })
    @Expose()
    title: string;

    @ApiProperty({ description: '게시글 내용' })
    @Expose()
    content: string;

    @ApiProperty({ description: '작성자 이름' })
    @Expose()
    authorName: string;

    @ApiProperty({ description: '조회수' })
    @Expose()
    viewCount: number;

    @ApiProperty({ description: '작성일' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: '수정일' })
    @Expose()
    updatedAt: Date;
}
```

### 풀이

- **`@Exclude()` (클래스 위)**: 기본은 모든 필드를 응답에서 제외. 안전한 기본값.
- **`@Expose()` (필드 위)**: 이 필드만 응답에 포함.
- **`@ApiProperty(...)`**: Swagger 문서에 설명 표시.
- **`deletedAt`이 없음**: Soft Delete 필드는 관리자에게도 굳이 보낼 필요 없으니 응답에서 뺌. (필요하면 추가하면 됨)

### 2-2. 요청 DTO — `board-create.dto.ts`

**파일**: `apps/server/src/app/board/dtos/board-create.dto.ts`

[기존 예시 — apps/server/src/app/admin/dtos/admin-sign-in.dto.ts](../apps/server/src/app/admin/dtos/admin-sign-in.dto.ts) 참고.

```ts
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class BoardCreateDTO {
    @ApiProperty({ description: '게시글 제목' })
    @IsNotEmpty({ message: '제목은 필수 입력 항목입니다.' })
    @IsString()
    @MaxLength(200, { message: '제목은 200자 이하여야 합니다.' })
    title: string;

    @ApiProperty({ description: '게시글 내용' })
    @IsNotEmpty({ message: '내용은 필수 입력 항목입니다.' })
    @IsString()
    content: string;

    @ApiProperty({ description: '작성자 이름' })
    @IsNotEmpty({ message: '작성자 이름은 필수 입력 항목입니다.' })
    @IsString()
    @MaxLength(50)
    authorName: string;
}
```

### 풀이

- **`@IsNotEmpty()`, `@IsString()`, `@MaxLength()`**: 클라이언트가 보낸 값이 이 규칙을 만족해야 함.
- 통과 못하면 ValidationPipe가 자동으로 400 에러 반환.
- `message: '...'`는 실패 시 클라이언트에 보낼 메시지 (한국어로 적어두면 그대로 사용자에게 표시됨).
- **응답 DTO와 요청 DTO를 분리하는 이유**: 응답에는 id/createdAt 등이 있지만 요청에는 없음(자동 생성됨). 검증 규칙도 다름.

### 2-3. Service — `board.service.ts`

**파일**: `apps/server/src/app/board/board.service.ts`

[기존 예시 — apps/server/src/app/faq/faq.service.ts](../apps/server/src/app/faq/faq.service.ts) 참고.

```ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Board } from "@prisma/client";
import { BoardCreateDTO } from "./dtos/board-create.dto";

@Injectable()
export class BoardService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async findAll(): Promise<Board[]> {
        return this.prisma.board.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string): Promise<Board> {
        const board = await this.prisma.board.findFirst({
            where: { id, deletedAt: null },
        });

        if (!board) throw new NotFoundException('게시글을 찾을 수 없습니다.');

        return board;
    }

    async create(data: BoardCreateDTO): Promise<Board> {
        return this.prisma.board.create({
            data: {
                title: data.title,
                content: data.content,
                authorName: data.authorName,
            },
        });
    }

    async update(id: string, data: BoardCreateDTO): Promise<Board> {
        await this.findById(id);  // 존재 확인

        return this.prisma.board.update({
            where: { id },
            data: {
                title: data.title,
                content: data.content,
                authorName: data.authorName,
            },
        });
    }

    async remove(id: string): Promise<Board> {
        await this.findById(id);

        return this.prisma.board.update({
            where: { id },
            data: { deletedAt: new Date() },  // Soft Delete
        });
    }
}
```

### 풀이

- **`@Injectable()`**: 이 클래스를 NestJS DI에 등록 → 다른 곳에서 `constructor`로 받아 쓸 수 있음.
- **`constructor(private readonly prisma: PrismaService)`**: PrismaService를 자동 주입받음. `private`라 외부에서 접근 불가, `readonly`라 재할당 불가.
- **`findAll`**: 모든 게시글 조회 (삭제되지 않은 것만, 최신순).
- **`findById`**: 한 건 조회. 없으면 404 에러.
- **`create`**: DB에 새 행 추가.
- **`update`**: 먼저 존재 확인 후, prisma update로 변경.
- **`remove`**: Soft Delete. 실제 삭제 안 하고 deletedAt만 기록.

### 비유

Service = 회사의 실무 작업장. Controller가 받은 일을 실제로 처리하는 곳.

### 2-4. Controller — `board.controller.ts`

**파일**: `apps/server/src/app/board/board.controller.ts`

[기존 예시 — apps/server/src/app/faq/faq.controller.ts](../apps/server/src/app/faq/faq.controller.ts) 참고.

```ts
import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { BoardService } from "./board.service";
import { plainToInstance } from "class-transformer";
import { BoardDTO } from "./dtos/board.dto";
import { BoardCreateDTO } from "./dtos/board-create.dto";

@ApiTags('board')
@Controller('board')
export class BoardController {
    constructor(private readonly boardService: BoardService) { }

    @Get()
    @ApiOperation({ summary: '게시글 전체 조회', description: '게시글 목록을 최신순으로 조회합니다.' })
    @ApiOkResponse({ description: '게시글 목록 조회 성공', type: BoardDTO, isArray: true })
    async findAll(): Promise<BoardDTO[]> {
        const boards = await this.boardService.findAll();
        return plainToInstance(BoardDTO, boards);
    }

    @Get(':id')
    @ApiParam({ name: 'id', type: String })
    @ApiOperation({ summary: '게시글 상세 조회' })
    @ApiOkResponse({ description: '게시글 상세 조회 성공', type: BoardDTO })
    async findById(@Param('id') id: string): Promise<BoardDTO> {
        const board = await this.boardService.findById(id);
        return plainToInstance(BoardDTO, board);
    }

    @Post('create')
    @ApiOperation({ summary: '게시글 신규 등록' })
    @ApiOkResponse({ description: '게시글 신규 등록 성공', type: BoardDTO })
    async create(@Body() data: BoardCreateDTO): Promise<BoardDTO> {
        const board = await this.boardService.create(data);
        return plainToInstance(BoardDTO, board);
    }

    @Patch(':id')
    @ApiParam({ name: 'id', type: String })
    @ApiOperation({ summary: '게시글 수정' })
    @ApiOkResponse({ description: '게시글 수정 성공', type: BoardDTO })
    async update(@Param('id') id: string, @Body() data: BoardCreateDTO): Promise<BoardDTO> {
        const board = await this.boardService.update(id, data);
        return plainToInstance(BoardDTO, board);
    }

    @Delete(':id')
    @ApiParam({ name: 'id', type: String })
    @ApiOperation({ summary: '게시글 삭제 (Soft Delete)' })
    @ApiOkResponse({ description: '게시글 삭제 성공', type: BoardDTO })
    async remove(@Param('id') id: string): Promise<BoardDTO> {
        const board = await this.boardService.remove(id);
        return plainToInstance(BoardDTO, board);
    }
}
```

### 풀이

- **`@Controller('board')`**: 이 컨트롤러의 모든 라우트 앞에 `/board`가 붙음. 전역 prefix(`/api`) 포함 시 `/api/board`.
- **`@Get()`, `@Get(':id')`**: HTTP GET 요청. `:id`는 URL의 변수 부분 (예: `/api/board/abc-123`).
- **`@Post('create')`**: POST 요청 + 추가 경로 'create'. → `/api/board/create`.
- **`@Patch(':id')`**: PATCH (부분 수정).
- **`@Delete(':id')`**: DELETE 요청.
- **`@Body() data: BoardCreateDTO`**: 요청 본문(JSON)을 BoardCreateDTO로 변환 + 자동 검증.
- **`@Param('id') id: string`**: URL의 `:id` 부분 추출.
- **`plainToInstance(BoardDTO, board)`**: 응답을 BoardDTO로 변환해서 민감한/불필요한 필드 제거.

### 비유

Controller = 우체국 접수창구. 손님이 보낸 요청을 받아서, 어떤 종류인지 판단하고(`@Get`, `@Post` 등), 작업장(Service)에 넘김.

### 2-5. Module — `board.module.ts`

**파일**: `apps/server/src/app/board/board.module.ts`

```ts
import { Module } from "@nestjs/common";
import { BoardController } from "./board.controller";
import { BoardService } from "./board.service";

@Module({
    imports: [],
    controllers: [BoardController],
    providers: [BoardService],
})
export class BoardModule { }
```

### 풀이

- **`@Module(...)`**: 이 클래스를 NestJS 모듈로 표시.
- **`imports: []`**: 다른 모듈 가져올 게 없음 (PrismaModule은 @Global이라 자동).
- **`controllers: [BoardController]`**: 이 모듈이 가진 컨트롤러.
- **`providers: [BoardService]`**: 이 모듈이 가진 서비스.

### 비유

Module = 부서. Controller(접수창구)와 Service(작업장)를 한 부서로 묶는 것.

### 2-6. AppModule에 등록

**파일**: [apps/server/src/app/app.module.ts](../apps/server/src/app/app.module.ts)

새로 만든 모듈을 루트 모듈에 등록해야 활성화됩니다:

```ts
import { BoardModule } from './board/board.module';  // ← 추가

@Module({
    imports: [
        PrismaModule,
        AdminModule,
        EventEmitterModule.forRoot(),
        FaqModule,
        NoticeModule,
        EventModule,
        BoardModule,    // ← 추가
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
```

이 한 줄을 빠뜨리면 컨트롤러가 작동하지 않아요. 404 에러가 나면 가장 먼저 의심해야 할 곳.

### 2-7. 서버 재시작 (자동으로 API client 갱신)

서버를 재시작하면 [main.ts](../apps/server/src/main.ts)의 `generateApiClient`가 자동으로 실행되어 admin 앱에서 사용할 함수들이 자동 생성됩니다.

- 생성 위치: `libs/api-client/src/lib/`
- 생성 결과: `boardControllerFindAll`, `boardControllerCreate`, `boardControllerFindById`, `boardControllerUpdate`, `boardControllerRemove` 같은 함수들
- 응답 타입도 자동 생성: `BoardDto` (서버의 BoardDTO에 대응)

### 비유

서버에 새 메뉴를 추가하면, **자동 발주서**가 본사(admin 앱)로 전송돼서 본사가 그 메뉴를 주문할 수 있게 됨. 발주서를 손으로 만들 필요 없음.

### 2-8. Swagger UI로 동작 확인

브라우저에서 `http://localhost:3000/reference` 열기. board 그룹이 새로 생기고 5개 API가 보임. 직접 호출해서 동작 확인 가능.

---

## 3단계: 관리자 화면 (Angular)

### 폴더 구조

`apps/admin/src/app/pages/board/` 폴더를 새로 만들고:

```
board/
├── board.page.ts                       (목록)
├── board.page.html
├── board-detail/
│   ├── board-detail.page.ts            (상세)
│   └── board-detail.page.html
└── board-form/
    ├── board-form.page.ts              (등록/수정)
    └── board-form.page.html
```

### 3-1. 목록 페이지 — `board.page.ts`

**파일**: `apps/admin/src/app/pages/board/board.page.ts`

[기존 예시 — apps/admin/src/app/pages/faq/faq.page.ts](../apps/admin/src/app/pages/faq/faq.page.ts) 참고.

```ts
import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { Api, boardControllerFindAll, BoardDto } from "@api-client";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { DataTableComponent } from "../../components/data-table/data-table.component";
import { ColumnDef } from "../../components/data-table/data-table.types";

@Component({
    selector: 'app-board',
    templateUrl: './board.page.html',
    imports: [CommonModule, RouterLink, PageHeaderComponent, DataTableComponent]
})
export default class BoardPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    boards: BoardDto[] = [];

    columns: ColumnDef[] = [
        { field: 'title', name: '제목', truncate: true },
        { field: 'authorName', name: '작성자' },
        { field: 'viewCount', name: '조회수' },
        { field: 'createdAt', name: '작성일', type: 'date', width: 'w-44' },
    ];

    async ngOnInit() {
        await this.loadData();
    }

    async loadData() {
        try {
            this.boards = await this.api.invoke(boardControllerFindAll, {});
            this.cdr.markForCheck();
        } catch (error) {
            console.error('게시글 목록 조회 실패', error);
        }
    }

    goDetail(board: BoardDto) {
        this.router.navigate(['/board', board.id]);
    }
}
```

### 풀이

- **`@Component({...})`**: 이 클래스를 Angular 컴포넌트로 선언.
- **`selector: 'app-board'`**: HTML에서 `<app-board></app-board>` 태그로 사용 가능 (라우터가 자동 처리).
- **`templateUrl`**: 같이 묶일 HTML 파일.
- **`imports`**: 이 컴포넌트가 HTML에서 사용할 다른 컴포넌트들 등록.
- **`export default class BoardPage implements OnInit`**: `default` export라 라우터의 `loadComponent`에서 자동 인식. `OnInit` 인터페이스를 구현하므로 ngOnInit() 메서드 필수.
- **`private readonly api = inject(Api)`**: 자동 생성된 API 클라이언트 주입.
- **`columns: ColumnDef[]`**: 테이블 컬럼 정의.
- **`async ngOnInit() { await this.loadData(); }`**: 컴포넌트 생성 직후 자동 호출. 첫 데이터 로딩.
- **`api.invoke(boardControllerFindAll, {})`**: 서버 호출. 결과는 BoardDto 배열.
- **`cdr.markForCheck()`**: Zoneless 모드에서 데이터 변경 후 화면 갱신을 명시적으로 트리거.

### 3-2. 목록 페이지 — `board.page.html`

```html
<app-page-header title="게시판 관리">
    <p slot="description" class="text-base leading-6 text-on-surface-variant mt-1">
        게시판을 관리합니다.
    </p>
    <a slot="actions" routerLink="/board/create"
        class="bg-primary-container text-white px-6 py-2.5 rounded font-semibold text-xs flex items-center gap-2 hover:bg-primary transition-colors cursor-pointer">
        <span class="material-symbols-outlined text-[18px]">add</span>
        새 게시글 등록
    </a>
</app-page-header>

<app-data-table [columns]="columns" [items]="boards" emptyMessage="등록된 게시글이 없습니다."
    (rowClick)="goDetail($event)" />
```

### 풀이

- **`<app-page-header title="게시판 관리">`**: 공통 헤더 컴포넌트 사용.
- **`<p slot="description">`**: 슬롯으로 description 내용 전달.
- **`<a slot="actions">`**: 슬롯으로 우상단 액션 버튼 전달.
- **`<app-data-table [columns]="..." [items]="..." ...>`**: 테이블 컴포넌트에 데이터 바인딩.
- **`(rowClick)="goDetail($event)"`**: 행 클릭 이벤트 처리. `$event`는 클릭된 행 데이터.

### 3-3. 상세 페이지 — `board-detail.page.ts`

**파일**: `apps/admin/src/app/pages/board/board-detail/board-detail.page.ts`

[기존 예시 — apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.ts](../apps/admin/src/app/pages/faq/faq-detail/faq-detail.page.ts) 참고.

```ts
import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { Api, boardControllerFindById, boardControllerRemove, BoardDto } from "@api-client";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { DetailViewComponent } from "../../../components/detail-view/detail-view.component";

@Component({
    selector: 'app-board-detail',
    templateUrl: './board-detail.page.html',
    imports: [CommonModule, RouterLink, PageHeaderComponent, BreadcrumbComponent, DetailViewComponent]
})
export default class BoardDetailPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    id = input<string>();
    board: BoardDto | null = null;

    breadcrumbs: Breadcrumb[] = [
        { label: '게시판 관리', link: '/board' },
        { label: '상세 보기' },
    ];

    async ngOnInit() {
        const id = this.id();
        if (!id) return;

        try {
            this.board = await this.api.invoke(boardControllerFindById, { id });
            this.cdr.markForCheck();
        } catch (error) {
            console.error('게시글 조회 실패', error);
            this.router.navigate(['/board']);
        }
    }

    async onDelete() {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await this.api.invoke(boardControllerRemove, { id: this.board!.id });
            this.router.navigate(['/board']);
        } catch (error) {
            console.error('게시글 삭제 실패', error);
        }
    }
}
```

### 풀이

- **`id = input<string>();`**: URL의 `:id` 파라미터가 자동 주입됨 (app.config.ts의 `withComponentInputBinding()` 덕분).
- **`board: BoardDto | null = null;`**: 데이터 로딩 전 상태.
- **`breadcrumbs: Breadcrumb[]`**: 페이지 경로 표시용.
- **`async ngOnInit()`**: URL의 id로 게시글 조회. 실패 시 목록으로 redirect.
- **`onDelete()`**: 삭제 처리. 사용자 확인 후 API 호출.

### 3-4. 상세 페이지 — `board-detail.page.html`

```html
@if (board) {
<app-page-header [title]="board.title">
    <app-breadcrumb slot="breadcrumb" [items]="breadcrumbs" />
    <a slot="actions" [routerLink]="'/board/' + board.id + '/edit'"
        class="px-4 py-2 text-primary font-semibold text-xs border border-outline-variant rounded hover:bg-surface-container-low transition-colors flex items-center gap-1 cursor-pointer">
        <span class="material-symbols-outlined text-[18px]">edit</span>
        수정
    </a>
    <button slot="actions" (click)="onDelete()"
        class="px-4 py-2 text-error font-semibold text-xs border border-transparent rounded hover:bg-error-container/20 transition-colors flex items-center gap-1 cursor-pointer">
        <span class="material-symbols-outlined text-[18px]">delete</span>
        삭제
    </button>
</app-page-header>

<app-detail-view [createdAt]="board.createdAt" [updatedAt]="board.updatedAt" backLink="/board">
    <div class="text-sm text-on-surface-variant mb-4">
        작성자: {{ board.authorName }} | 조회수: {{ board.viewCount }}
    </div>
    <div class="whitespace-pre-wrap">{{ board.content }}</div>
</app-detail-view>
}
```

### 풀이

- **`@if (board) { ... }`**: 데이터 로딩 전엔 아무것도 표시 안 함.
- **`<app-breadcrumb slot="breadcrumb">`**: 슬롯에 breadcrumb 컴포넌트 끼워넣기.
- **`<a slot="actions">`, `<button slot="actions">`**: 같은 슬롯에 여러 요소 가능.
- **`<app-detail-view>`**: 본문 + 하단 "목록으로" 버튼 자동 처리.
- **`{{ board.content }}`**: 데이터 보간 (Angular의 템플릿 문법).
- **`whitespace-pre-wrap`**: 줄바꿈 보존 CSS.

### 3-5. 등록/수정 페이지 — `board-form.page.ts`

**파일**: `apps/admin/src/app/pages/board/board-form/board-form.page.ts`

[기존 예시 — apps/admin/src/app/pages/faq/faq-form/faq-form.page.ts](../apps/admin/src/app/pages/faq/faq-form/faq-form.page.ts) 참고.

```ts
import { CommonModule, Location } from "@angular/common";
import { ChangeDetectorRef, Component, inject, input, OnInit } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Api, boardControllerCreate, boardControllerFindById, boardControllerUpdate } from "@api-client";
import { PageHeaderComponent } from "../../../components/page-header/page-header.component";
import { Breadcrumb, BreadcrumbComponent } from "../../../components/breadcrumb/breadcrumb.component";
import { FormViewComponent } from "../../../components/form-view/form-view.component";
import { FormFieldComponent } from "../../../components/form-field/form-field.component";

@Component({
    selector: 'app-board-form',
    templateUrl: './board-form.page.html',
    imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, BreadcrumbComponent, FormViewComponent, FormFieldComponent],
})
export default class BoardFormPage implements OnInit {
    private readonly api = inject(Api);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly location = inject(Location);

    id = input<string>();
    get isEditMode() { return !!this.id(); }

    breadcrumbs: Breadcrumb[] = [];

    form = new FormGroup({
        title: new FormControl('', {
            validators: [Validators.required],
            nonNullable: true,
        }),
        content: new FormControl('', {
            validators: [Validators.required],
            nonNullable: true,
        }),
        authorName: new FormControl('', {
            validators: [Validators.required],
            nonNullable: true,
        }),
    });

    errorMessage = '';

    async ngOnInit() {
        const id = this.id();

        this.breadcrumbs = [
            { label: '게시판 관리', link: '/board' },
            { label: this.isEditMode ? '수정' : '작성' },
        ];

        if (id) {
            const board = await this.api.invoke(boardControllerFindById, { id });
            this.form.patchValue({
                title: board.title,
                content: board.content,
                authorName: board.authorName,
            });
            this.cdr.markForCheck();
        }
    }

    async onSubmit() {
        if (this.form.invalid) return;
        const data = this.form.getRawValue();

        try {
            if (this.isEditMode) {
                await this.api.invoke(boardControllerUpdate, {
                    id: this.id()!,
                    body: data,
                });
                this.router.navigate(['/board', this.id()]);
            } else {
                const board = await this.api.invoke(boardControllerCreate, { body: data });
                this.router.navigate(['/board', board.id]);
            }
        } catch (error: any) {
            this.errorMessage = error?.error?.message || '요청이 실패했습니다.';
        }
    }

    goBack() {
        this.location.back();
    }
}
```

### 풀이

- **`get isEditMode() { return !!this.id(); }`**: URL에 id가 있으면 수정 모드, 없으면 생성 모드.
- **`form = new FormGroup({...})`**: Reactive Form 정의.
- **`Validators.required`**: 빈 값 거부.
- **`async ngOnInit()`**: 수정 모드면 기존 데이터를 가져와 폼에 채움 (`patchValue`).
- **`async onSubmit()`**: 폼 검증 후 모드에 따라 create/update 호출. 성공 시 상세 페이지로 이동.

### 3-6. 등록/수정 페이지 — `board-form.page.html`

```html
<app-page-header [title]="isEditMode ? '게시글 수정' : '게시글 작성'">
    <app-breadcrumb slot="breadcrumb" [items]="breadcrumbs" />
    <p slot="description" class="text-base leading-6 text-on-surface-variant mt-6">
        {{ isEditMode ? '게시글 내용을 수정합니다.' : '새로운 게시글을 작성합니다.' }}
    </p>
</app-page-header>

<app-form-view [formGroup]="form" [submitText]="isEditMode ? '수정하기' : '등록하기'"
               (cancel)="goBack()" (submit)="onSubmit()">

    <app-form-field label="제목" for="board-title">
        <input formControlName="title" id="board-title" type="text" maxlength="200" placeholder="제목을 입력하세요"
            class="w-full px-4 py-3 border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-base transition-all placeholder:text-outline" />
    </app-form-field>

    <app-form-field label="작성자" for="board-author">
        <input formControlName="authorName" id="board-author" type="text" maxlength="50" placeholder="작성자 이름"
            class="w-full px-4 py-3 border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-base transition-all placeholder:text-outline" />
    </app-form-field>

    <app-form-field label="내용" for="board-content">
        <textarea formControlName="content" id="board-content" rows="16" placeholder="내용을 입력하세요"
            class="w-full px-4 py-3 border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all placeholder:text-outline resize-none"></textarea>
    </app-form-field>

    @if (errorMessage) {
    <p class="text-error text-sm">{{ errorMessage }}</p>
    }
</app-form-view>
```

### 풀이

- `<app-form-view [formGroup]="form" ...>`: 폼 컴포넌트.
- `<app-form-field label="제목" for="board-title">`: 라벨 + 입력칸 묶음.
- `formControlName="title"`: form의 'title' 컨트롤과 연결.
- `(cancel)="goBack()"`, `(submit)="onSubmit()"`: 폼 액션 이벤트 연결.

### 3-7. 라우트 등록 — `app.routes.ts`

**파일**: [apps/admin/src/app/app.routes.ts](../apps/admin/src/app/app.routes.ts)

DefaultLayout의 children 배열에 라우트 3개 추가:

```ts
{
    path: '',
    component: DefaultLayout,
    children: [
        // ... 기존 라우트들 ...

        {
            path: 'board',
            data: { title: '게시판 관리' },
            loadComponent: () => import('./pages/board/board.page'),
        },
        {
            path: 'board/create',
            data: { title: '게시글 작성' },
            loadComponent: () => import('./pages/board/board-form/board-form.page'),
        },
        {
            path: 'board/:id',
            data: { title: '게시글 상세' },
            loadComponent: () => import('./pages/board/board-detail/board-detail.page'),
        },
        {
            path: 'board/:id/edit',
            data: { title: '게시글 수정' },
            loadComponent: () => import('./pages/board/board-form/board-form.page'),
        },
    ]
}
```

### 풀이

- **`path: 'board'`**: `/board` URL → 목록 페이지.
- **`path: 'board/create'`**: `/board/create` → 폼 페이지 (신규 모드).
- **`path: 'board/:id'`**: `/board/abc-123` 같은 동적 URL → 상세 페이지. `:id`가 컴포넌트의 `id = input<string>()`에 자동 주입.
- **`path: 'board/:id/edit'`**: `/board/abc-123/edit` → 폼 페이지 (수정 모드, id 있음).
- **`loadComponent: () => import(...)`**: 지연 로딩. 그 URL 접속 시에만 코드 다운로드.

### 순서 주의

- `'board/create'`가 `'board/:id'` 보다 **위에** 있어야 함.
- 아래에 두면 `/board/create` URL이 `'board/:id'`에 먼저 매칭돼서 `id = 'create'`로 인식됨.

### 3-8. 사이드바 메뉴 추가 — `sidebar.component.ts`

**파일**: [apps/admin/src/app/layout/sidebar/sidebar.component.ts](../apps/admin/src/app/layout/sidebar/sidebar.component.ts)

`menuItems` 배열에 추가:

```ts
menuItems = [
    { label: '대시보드', icon: 'dashboard', path: '/dashboard' },
    { label: 'FAQ 관리', icon: 'quiz', path: '/faq' },
    { label: '공지사항 관리', icon: 'campaign', path: '/notice' },
    { label: '행사 관리', icon: 'event', path: '/event' },
    { label: '사전 등록 관리', icon: 'how_to_reg', path: '/pre-registration' },
    { label: '갤러리 관리', icon: 'photo_library', path: '/gallery' },
    { label: '사업자 정보', icon: 'business', path: '/business-info' },
    { label: '약관 관리', icon: 'description', path: '/terms' },
    { label: '1:1 문의', icon: 'chat', path: '/inquiry' },
    { label: '게시판 관리', icon: 'forum', path: '/board' },  // ← 추가
];
```

`icon`은 Material Symbols 아이콘 이름. 적절한 거 골라 입력.

---

## 4단계: 동작 확인

### 4-1. 서버 + admin 재시작

```bash
# 터미널 1
pnpm nx serve server

# 터미널 2
pnpm nx serve admin
```

### 4-2. 브라우저에서 테스트

1. `http://localhost:4200/` 접속 → 로그인 페이지로 자동 이동
2. 로그인
3. 사이드바에서 "게시판 관리" 클릭 → 빈 목록 표시
4. "새 게시글 등록" 클릭 → 폼 페이지
5. 제목/내용/작성자 입력 → 등록 버튼 → 상세 페이지로 이동
6. 수정 버튼 → 폼 페이지(수정 모드) → 수정 → 상세로 돌아옴
7. 삭제 버튼 → 확인 → 목록으로 돌아옴

### 4-3. 검증 — 에러 케이스 테스트

- 제목 비우고 등록 → "제목은 필수 입력 항목입니다." 표시
- 200자 초과 → "제목은 200자 이하여야 합니다." 표시

### 4-4. 검증 — Swagger UI로 직접 호출

`http://localhost:3000/reference` 에서 board 그룹의 API들 직접 호출 → 정상 동작 확인.

### 4-5. 검증 — DB 직접 확인

`pnpm prisma studio`로 DB GUI 열어서 Board 테이블에 데이터가 실제로 저장됐는지 확인.

---

## 체크리스트 (정리)

새 도메인 추가할 때 빠진 게 없는지 체크:

### DB
- [ ] `prisma/<domain>.prisma` 파일 작성
- [ ] `pnpm prisma migrate dev --name add_<domain>` 실행
- [ ] prisma studio로 테이블 생성 확인

### 서버 (NestJS)
- [ ] `apps/server/src/app/<domain>/` 폴더 생성
- [ ] `<domain>.module.ts` 작성
- [ ] `<domain>.controller.ts` 작성 (필요한 HTTP 메서드만)
- [ ] `<domain>.service.ts` 작성
- [ ] `dtos/<domain>.dto.ts` (응답) 작성
- [ ] `dtos/<domain>-create.dto.ts` (요청) 작성
- [ ] `app.module.ts`에 BoardModule import 추가
- [ ] 서버 재시작
- [ ] Swagger UI에서 API 확인

### 관리자 화면 (Angular)
- [ ] `apps/admin/src/app/pages/<domain>/` 폴더 생성
- [ ] `<domain>.page.ts` + `.html` (목록)
- [ ] `<domain>-detail/<domain>-detail.page.ts` + `.html` (상세)
- [ ] `<domain>-form/<domain>-form.page.ts` + `.html` (폼)
- [ ] `app.routes.ts`에 라우트 4개 (목록 / 생성 / 상세 / 수정) 추가
- [ ] `sidebar.component.ts`에 메뉴 추가
- [ ] admin 재시작
- [ ] 브라우저에서 동작 확인

---

## 자주 하는 실수

| 증상 | 원인 |
| --- | --- |
| 404 에러 | `app.module.ts`에 새 모듈 import 안 함 |
| 페이지 안 보임 | `app.routes.ts`에 라우트 안 등록 / sidebar에 메뉴 없음 |
| 한글 깨짐 | DB 인코딩 문제 (docker-compose에 `TZ: Asia/Seoul` 있음) |
| 폼 검증 실패 메시지 안 나옴 | HTML에서 `@if (errorMessage)` 안 적음 |
| 클라이언트 함수 없음 (`boardControllerFindAll` 없다고 함) | 서버 재시작 안 함 / `libs/api-client/` 자동 갱신 안 됨 |
| 라우트가 잘못 매칭됨 | `'board/create'`가 `'board/:id'` 아래에 있음 |
| 'cdr.markForCheck()' 없어서 화면 안 갱신 | Zoneless 모드에서 데이터 변경 후 호출 누락 |

---

## 마무리

처음엔 파일이 많아 보이지만, 실제로는 **8개 핵심 패턴의 반복**입니다:
1. prisma 모델 정의
2. 응답 DTO + 요청 DTO
3. Service (CRUD 함수)
4. Controller (HTTP 매핑)
5. Module + AppModule 등록
6. 페이지 컴포넌트 (목록 / 상세 / 폼) 3개
7. 라우트 등록
8. 사이드바 메뉴

새 도메인을 만들 때마다 이 8개 패턴을 따라가면 됩니다. 두 번 정도 만들어보면 손이 자동으로 움직여요.

이 레시피를 따라하면서 막히는 부분 있으면, 각 단계의 [기존 예시 파일]을 열어 비교해보세요. 똑같은 패턴이라는 게 보일 거예요.
