import { Expose } from "class-transformer";
import type { UserRole } from "../../../generated/prisma/client";

/**
 * Shape returned by `GET /auth/me`. `sub` mirrors the JWT claim name the web
 * client already reads.
 */
export class AuthUserEntity {
  @Expose()
  sub: string;

  @Expose()
  email: string;

  @Expose()
  name: string | null;

  @Expose()
  role: UserRole;

  @Expose()
  firmId: string | null;

  @Expose()
  isCheckedIn: boolean;
}

export class AuthResultEntity {
  @Expose()
  success: boolean;

  @Expose()
  message: string;
}
