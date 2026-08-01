import type { CookieOptions } from "express";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export const BCRYPT_ROUNDS = 10;

/**
 * Cookie lifetimes mirror the JWT lifetimes so a cookie never outlives the
 * token it carries. Previously the access cookie lived 24h while the token
 * expired after 15m, which forced a refresh round-trip on nearly every request.
 */
export const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function authCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeMs
  };
}
