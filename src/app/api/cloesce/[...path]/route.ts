import { env } from "cloudflare:workers";
import { CloesceApp } from "cloesce/backend";
import cidl from "../../../../../.generated/cidl.json";
import {
  BetterAuthAccount,
  BetterAuthSession,
  BetterAuthUser,
  BetterAuthVerification,
  Env as CloesceEnv,
} from "@/data/models.cloesce";

const constructorRegistry: Record<string, new () => any> = {
  BetterAuthUser,
  BetterAuthSession,
  BetterAuthAccount,
  BetterAuthVerification,
  Env: CloesceEnv,
};

let appPromise: Promise<CloesceApp> | null = null;

async function getApp(): Promise<CloesceApp> {
  if (!appPromise) {
    appPromise = CloesceApp.init(cidl as any, constructorRegistry).then((app) => {
      app.routePrefix = "api/cloesce";
      return app;
    });
  }

  return appPromise;
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
