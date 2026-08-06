import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";
import type { EnvironmentVariables } from "../../../config/env.validation";

export const GOOGLE_STRATEGY = "google";

export interface GoogleProfileUser {
  googleId: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}

/**
 * Builds the Google OAuth strategy for the current config.
 *
 * When Google credentials are absent (the default dev state) this returns a
 * harmless placeholder class so the AuthModule still boots — the
 * GoogleOAuthGuard short-circuits with a 503 before passport is consulted, so
 * the real strategy is never invoked. `passport-oauth2`'s constructor throws
 * when clientID is empty, so the strategy must NOT be constructed without
 * credentials.
 */
export function buildGoogleStrategy(
  config: ConfigService<EnvironmentVariables, true>
) {
  const clientID = config.get("GOOGLE_CLIENT_ID", { infer: true });
  const clientSecret = config.get("GOOGLE_CLIENT_SECRET", { infer: true });
  const callbackURL = config.get("GOOGLE_CALLBACK_URL", { infer: true });

  if (!clientID || !clientSecret || !callbackURL) {
    return class PlaceholderGoogleStrategy {};
  }

  // Guard above guarantees all three are present; the casts keep the strategy
  // constructor's non-null types honest without a separate options type.
  const strategyOptions = {
    clientID: clientID as string,
    clientSecret: clientSecret as string,
    callbackURL: callbackURL as string,
    scope: ["email", "profile"] as string[]
  };

  @Injectable()
  class GoogleStrategyImpl extends PassportStrategy(Strategy, GOOGLE_STRATEGY) {
    constructor() {
      super(strategyOptions);
    }

    validate(
      _accessToken: string,
      _refreshToken: string,
      profile: Profile
    ): GoogleProfileUser {
      return {
        googleId: profile.id,
        email: profile.emails?.[0]?.value?.toLowerCase() ?? null,
        name: profile.displayName ?? null,
        picture: profile.photos?.[0]?.value ?? null
      };
    }
  }

  return GoogleStrategyImpl;
}

/** DI token for the Google strategy provider (real strategy or placeholder). */
export const GoogleStrategy = Symbol("GoogleStrategy");
