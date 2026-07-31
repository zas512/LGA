import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * Opts a route out of the globally registered AccessTokenGuard.
 * Everything is authenticated by default; this is the only escape hatch.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
