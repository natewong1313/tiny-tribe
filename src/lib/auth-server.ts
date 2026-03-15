import { createAuth } from "@/lib/auth";
import { env } from "cloudflare:workers";

export const getAuth = () =>
  createAuth({
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    db: env.db,
  });
