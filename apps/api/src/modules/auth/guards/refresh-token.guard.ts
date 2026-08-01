import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { REFRESH_TOKEN_STRATEGY } from "../strategies/refresh-token.strategy";

/**
 * Applied explicitly on `/auth/refresh` and `/auth/logout`, which are marked
 * `@Public()` so the global access-token guard steps aside for them.
 */
@Injectable()
export class RefreshTokenGuard extends AuthGuard(REFRESH_TOKEN_STRATEGY) {}
