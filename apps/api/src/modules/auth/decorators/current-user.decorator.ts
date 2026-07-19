import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { JwtPayload } from "../strategies/access-token.strategy";

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  }
);
