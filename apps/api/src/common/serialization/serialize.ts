import { plainToInstance } from "class-transformer";
import type { ClassConstructor } from "class-transformer";

/**
 * `excludeExtraneousValues` is the important flag here: only properties the
 * entity marks with `@Expose()` survive. That makes leaking a column such as
 * `passwordHash` or `refreshTokenHash` impossible by construction, rather than
 * relying on every Prisma query remembering the right `select`.
 */
const TRANSFORM_OPTIONS = {
  excludeExtraneousValues: true,
  exposeUnsetFields: false
} as const;

export function toEntity<T>(cls: ClassConstructor<T>, plain: unknown): T {
  return plainToInstance(cls, plain, TRANSFORM_OPTIONS);
}

export function toEntities<T>(cls: ClassConstructor<T>, plain: unknown[]): T[] {
  return plainToInstance(cls, plain, TRANSFORM_OPTIONS);
}
