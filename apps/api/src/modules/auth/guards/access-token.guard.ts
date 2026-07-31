import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import type { Observable } from "rxjs";
import { IS_PUBLIC_KEY } from "../../../common/decorators/public.decorator";
import { ACCESS_TOKEN_STRATEGY } from "../strategies/access-token.strategy";

/**
 * Registered globally as an APP_GUARD, so every route is authenticated unless
 * it opts out with `@Public()`. Previously each controller had to remember
 * `@UseGuards(AccessTokenGuard)` and the leave/expenses controllers did not,
 * leaving them reachable without a token.
 */
@Injectable()
export class AccessTokenGuard extends AuthGuard(ACCESS_TOKEN_STRATEGY) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
