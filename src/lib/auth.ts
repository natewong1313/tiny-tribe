import { D1Database } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { cloesceBetterAuthAdapter } from "@/lib/cloesce-better-auth-adapter";

interface Env {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  db: D1Database;
}

export const createAuth = (env: Env) =>
  betterAuth({
    account: {
      fields: {
        accessToken: "access_token",
        accessTokenExpiresAt: "access_token_expires_at",
        accountId: "account_id",
        createdAt: "created_at",
        idToken: "id_token",
        providerId: "provider_id",
        refreshToken: "refresh_token",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        updatedAt: "updated_at",
        userId: "user_id",
      },
      modelName: "BetterAuthAccount",
    },
    baseURL: env.BETTER_AUTH_URL,
    database: cloesceBetterAuthAdapter(env.db),
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
    secret: env.BETTER_AUTH_SECRET,
    session: {
      fields: {
        createdAt: "created_at",
        expiresAt: "expires_at",
        ipAddress: "ip_address",
        updatedAt: "updated_at",
        userAgent: "user_agent",
        userId: "user_id",
      },
      modelName: "BetterAuthSession",
    },
    trustedOrigins: ["http://localhost:3000", env.BETTER_AUTH_URL],
    user: {
      fields: {
        createdAt: "created_at",
        emailVerified: "email_verified",
        updatedAt: "updated_at",
      },
      modelName: "BetterAuthUser",
    },
    verification: {
      fields: {
        createdAt: "created_at",
        expiresAt: "expires_at",
        updatedAt: "updated_at",
      },
      modelName: "BetterAuthVerification",
    },
  });

export type Auth = ReturnType<typeof createAuth>;
export type Session = Awaited<ReturnType<Auth["api"]["getSession"]>>;
