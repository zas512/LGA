import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { toEntity } from "../../common/serialization/serialize";
import { AuthService, type AuthTokens } from "./auth.service";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  authCookieOptions
} from "./auth.constants";
import { CurrentUser } from "./decorators/current-user.decorator";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthResultEntity, AuthUserEntity } from "./entities/auth.entity";
import { RefreshTokenGuard } from "./guards/refresh-token.guard";
import type { JwtPayload } from "./strategies/access-token.strategy";
import type { RefreshTokenPayload } from "./strategies/refresh-token.strategy";

/** Credential endpoints get a tighter budget than the global 50 req/min. */
const CREDENTIAL_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("me")
  me(@CurrentUser() user: JwtPayload): Promise<AuthUserEntity> {
    return this.authService.getMe(user);
  }

  @Public()
  @Throttle(CREDENTIAL_THROTTLE)
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthResultEntity> {
    const tokens = await this.authService.register(dto);
    this.setAuthCookies(response, tokens);
    return AuthController.result("Registered successfully");
  }

  @Public()
  @Throttle(CREDENTIAL_THROTTLE)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthResultEntity> {
    const tokens = await this.authService.login(dto);
    this.setAuthCookies(response, tokens);
    return AuthController.result("Logged in successfully");
  }

  /**
   * `@Public()` disables the global access-token guard — by definition the
   * access token is expired here — and RefreshTokenGuard authenticates instead.
   */
  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: RefreshTokenPayload,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthResultEntity> {
    const tokens = await this.authService.refresh(user.sub, user.refreshToken);
    this.setAuthCookies(response, tokens);
    return AuthController.result("Token refreshed successfully");
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthResultEntity> {
    await this.authService.logout(user.sub);
    response.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
    response.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
    return AuthController.result("Logged out successfully");
  }

  private setAuthCookies(response: Response, tokens: AuthTokens): void {
    response.cookie(
      ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      authCookieOptions(ACCESS_TOKEN_COOKIE_MAX_AGE_MS)
    );
    response.cookie(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      authCookieOptions(REFRESH_TOKEN_COOKIE_MAX_AGE_MS)
    );
  }

  private static result(message: string): AuthResultEntity {
    return toEntity(AuthResultEntity, { success: true, message });
  }
}
