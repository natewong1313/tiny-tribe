import { env } from "cloudflare:workers";
import type { CloesceApp } from "cloesce/backend";
import { getCloesceApp } from "@/lib/cloesce-runtime";

async function getApp(): Promise<CloesceApp> {
  return getCloesceApp();
}

async function handler(request: Request): Promise<Response> {
  const app = await getApp();
  return app.run(request, env);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
