import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AccessTokenStrategy, ACCESS_TOKEN_STRATEGY } from "./strategies/access-token.strategy";
import { RefreshTokenStrategy } from "./strategies/refresh-token.strategy";

@Module({
  imports: [
    // Stateless API: no sessions, access token is the default strategy.
    PassportModule.register({
      defaultStrategy: ACCESS_TOKEN_STRATEGY,
      session: false
    }),
    // Secrets are supplied per-signature in AuthService because access and
    // refresh tokens use different keys.
    JwtModule.register({})
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy],
  exports: [AuthService]
})
export class AuthModule {}
