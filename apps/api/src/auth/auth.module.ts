import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { KakaoOAuthProvider } from "./kakao-oauth-provider";
import { SessionTokenIssuer } from "./session-token-issuer";

@Module({
  controllers: [AuthController],
  providers: [AuthService, KakaoOAuthProvider, SessionTokenIssuer],
  exports: [AuthService],
})
export class AuthModule {}
