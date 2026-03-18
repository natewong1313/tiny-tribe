import { getCloesceApp } from "@/lib/cloesce-runtime";
import type { CloesceApp } from "cloesce/backend";
import { env } from "cloudflare:workers";

const getApp = async (): Promise<CloesceApp> => getCloesceApp();

const handler = async (request: Request): Promise<Response> => {
  const app = await getApp();
  const result = await app.run(request, env);
  if (!result.ok) {
    const body = await result.text();
    return new Response(body, { status: result.status, headers: result.headers });
  }

  return result;
};

export const DELETE = handler;
export const GET = handler;
export const OPTIONS = handler;
export const PATCH = handler;
export const POST = handler;
export const PUT = handler;
