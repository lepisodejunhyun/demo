import { Module } from "@nestjs/common";
import { MemberController } from "./member.controller";
import { MemberService } from "./member.service";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { KakaoAuthController } from "./kakao-auth.controller";
import { KakaoAuthService } from "./kakao-auth.service";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_MEMBER || 'default-member-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [MemberController, KakaoAuthController],
  providers: [MemberService, JwtStrategy, KakaoAuthService],
  exports: [JwtModule, PassportModule],
})
export class MemberModule { }

