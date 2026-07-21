import {
  Body,
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res
} from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenGuard } from "./guards/refresh-token.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { JwtPayload } from "./strategies/access-token.strategy";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.register(dto);
    if (result && "accessToken" in result) {
      response.cookie("access_token", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 15 * 60 * 1000
      });
      response.cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      return { success: true, message: "Registered successfully" };
    }
    return result;
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const tokens = await this.authService.login(dto);
    console.log("login tokens: ", tokens);
    response.cookie("access_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 15 * 60 * 1000
    });
    response.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return {
      success: true,
      message: "Logged in successfully"
    };
  }

  @Post("refresh")
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: JwtPayload & { refreshToken: string },
    @Res({ passthrough: true }) response: Response
  ) {
    const tokens = await this.authService.refresh(user.sub, user.refreshToken);
    response.cookie("access_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 15 * 60 * 1000
    });
    response.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return { success: true, message: "Token refreshed successfully" };
  }

  @Post("logout")
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.authService.logout(user.sub);
    response.clearCookie("access_token", { path: "/" });
    response.clearCookie("refresh_token", { path: "/" });
    return { success: true, message: "Logged out successfully" };
  }
}
