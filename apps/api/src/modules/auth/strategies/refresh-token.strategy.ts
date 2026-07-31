import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";
import type { EnvironmentVariables } from "../../../config/env.validation";
import { REFRESH_TOKEN_COOKIE } from "../auth.constants";
import { cookieExtractor } from "../extractors/cookie.extractor";
import type { JwtPayload } from "./access-token.strategy";

export const REFRESH_TOKEN_STRATEGY = "jwt-refresh";

export type RefreshTokenPayload = JwtPayload & { refreshToken: string };

const refreshTokenFromRequest = ExtractJwt.fromExtractors([
  ExtractJwt.fromAuthHeaderAsBearerToken(),
  cookieExtractor(REFRESH_TOKEN_COOKIE)
]);

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  REFRESH_TOKEN_STRATEGY
) {
  constructor(config: ConfigService<EnvironmentVariables, true>) {
    super({
      jwtFromRequest: refreshTokenFromRequest,
      ignoreExpiration: false,
      secretOrKey: config.get("JWT_REFRESH_SECRET", { infer: true }),
      passReqToCallback: true
    });
  }

  validate(request: Request, payload: JwtPayload): RefreshTokenPayload {
    const refreshToken = refreshTokenFromRequest(request);
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }
    return { ...payload, refreshToken };
  }
}
