import { getCloesceApp } from "@/lib/cloesce-runtime";
import type { CloesceApp } from "cloesce/backend";
// @ts-expect-error cloudflare:workers is a runtime module provided by Cloudflare Workers
import { env } from "cloudflare:workers";

const getApp = async (): Promise<CloesceApp> => getCloesceApp();

const handler = async (request: Request): Promise<Response> => {
  try {
    const app = await getApp();
    const result = await app.run(request, env);
    if (!result.ok) {
      const body = await result.text();
      return new Response(body, { status: result.status, headers: result.headers });
    }

    return result;
  } catch (error) {
    console.error("Cloesce handler error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};

export const DELETE = handler;
export const GET = handler;
export const OPTIONS = handler;
export const PATCH = handler;
export const POST = handler;
export const PUT = handler;
