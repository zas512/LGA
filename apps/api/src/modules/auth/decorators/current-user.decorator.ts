import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { JwtPayload } from "../strategies/access-token.strategy";

type AuthenticatedRequest = Request & { user?: JwtPayload };

/**
 * `@CurrentUser()` yields the whole JWT payload, `@CurrentUser("firmId")` a
 * single claim — the form the NestJS docs recommend for param decorators.
 */
export const CurrentUser = createParamDecorator(
  (key: keyof JwtPayload | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      return undefined;
    }
    return key ? user[key] : user;
  }
);
