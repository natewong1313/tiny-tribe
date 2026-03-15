import { env } from "cloudflare:workers";
import { createAuth } from "@/lib/auth";

const auth = createAuth({
  db: env.db,
  BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: env.BETTER_AUTH_URL,
});

async function handler(request: Request): Promise<Response> {
  return auth.handler(request);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
