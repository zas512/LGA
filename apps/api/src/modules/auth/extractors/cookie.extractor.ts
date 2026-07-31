import type { Request } from "express";
import type { JwtFromRequestFunction } from "passport-jwt";

// `cookies` is typed `any` on Express's Request, so it is replaced rather than
// intersected — an intersection with `any` stays `any`.
type RequestWithCookies = Omit<Request, "cookies"> & {
  cookies?: Record<string, unknown>;
};

/**
 * The API issues httpOnly cookies on login/refresh but the strategies used to
 * read the bearer header only, so a browser talking to the API directly could
 * never authenticate. This reads `req.cookies` when a cookie parser is present
 * and otherwise falls back to parsing the raw header, so no extra dependency is
 * required.
 */
export function cookieExtractor(cookieName: string): JwtFromRequestFunction {
  return (request: RequestWithCookies): string | null => {
    const parsed: unknown = request?.cookies?.[cookieName];
    if (typeof parsed === "string" && parsed) {
      return parsed;
    }

    const header = request?.headers?.cookie;
    if (!header) {
      return null;
    }

    for (const pair of header.split(";")) {
      const separator = pair.indexOf("=");
      if (separator === -1) {
        continue;
      }
      if (pair.slice(0, separator).trim() === cookieName) {
        return decodeURIComponent(pair.slice(separator + 1).trim());
      }
    }

    return null;
  };
}
