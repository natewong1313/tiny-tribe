import { createAuth } from "@/lib/auth";
import { env } from "cloudflare:workers";

const auth = createAuth({
  BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: env.BETTER_AUTH_URL,
  db: env.db,
});

const handler = async (request: Request): Promise<Response> => auth.handler(request);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
