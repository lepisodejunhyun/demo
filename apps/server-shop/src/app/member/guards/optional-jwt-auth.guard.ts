import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Member } from "@prisma/client";

/**
 * 로그인 여부에 관계없이 요청을 통과시키는 Optional JWT Guard.
 * - 유효한 JWT가 있으면 req.user에 회원 정보가 설정됨
 * - JWT가 없거나 유효하지 않으면 req.user는 undefined (에러 발생 X)
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: Member | false): Member | null {
        // JWT가 없거나 유효하지 않아도 에러를 던지지 않음
        return user || null;
    }
}
