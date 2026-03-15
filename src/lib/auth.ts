import { betterAuth } from "better-auth";
import { D1Database } from "@cloudflare/workers-types";
import { cloesceBetterAuthAdapter } from "@/lib/cloesce-better-auth-adapter";

interface Env {
  db: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

export function createAuth(env: Env) {
  return betterAuth({
    database: cloesceBetterAuthAdapter(env.db),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    user: {
      modelName: "BetterAuthUser",
      fields: {
        emailVerified: "email_verified",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
      additionalFields: {
        username: {
          type: "string",
          required: true,
        },
      },
    },
    session: {
      modelName: "BetterAuthSession",
      fields: {
        userId: "user_id",
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    account: {
      modelName: "BetterAuthAccount",
      fields: {
        userId: "user_id",
        accountId: "account_id",
        providerId: "provider_id",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        idToken: "id_token",
        accessTokenExpiresAt: "access_token_expires_at",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    verification: {
      modelName: "BetterAuthVerification",
      fields: {
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        // Mock email for development - log to console
        console.log("Password reset email:");
        console.log(`To: ${user.email}`);
        console.log(`Reset URL: ${url}`);
      },
    },
    trustedOrigins: ["http://localhost:3000", env.BETTER_AUTH_URL],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Awaited<ReturnType<Auth["api"]["getSession"]>>;
