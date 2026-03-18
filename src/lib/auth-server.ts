import { createAuth } from "@/lib/auth";
// @ts-expect-error cloudflare:workers is a runtime module provided by Cloudflare Workers
import { env } from "cloudflare:workers";

let authInstance: ReturnType<typeof createAuth> | null = null;

export const getAuth = () => {
  if (!authInstance) {
    authInstance = createAuth({
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: env.BETTER_AUTH_URL,
      db: env.db,
    });
  }
  return authInstance;
};
