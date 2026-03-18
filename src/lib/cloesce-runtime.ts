import * as models from "@/data/models.cloesce";
import { Env as CloesceEnv } from "@/data/main.cloesce";
import { PostAppService, UserAppService } from "@/data/services.cloesce";
import { CloesceApp, Orm } from "cloesce/backend";
import cidl from "../../.generated/cidl.json";

interface ConstructorRegistry {
  [key: string]: new () => unknown;
}

// Imports all models from models.cloesce
const modelConstructors = Object.entries(models).reduce<ConstructorRegistry>(
  (acc, [key, value]) => {
    if (typeof value === "function") {
      acc[key] = value as new () => unknown;
    }
    return acc;
  },
  {},
);
const constructorRegistry: ConstructorRegistry = {
  ...modelConstructors,
  Env: CloesceEnv,
  PostAppService,
  UserAppService,
};

let appPromise: Promise<CloesceApp> | null = null;

function getCloesceWorkerUrl(): string {
  const workerUrl = process.env.CLOESCE_WORKER_URL;
  if (!workerUrl) {
    throw new Error("CLOESCE_WORKER_URL environment variable is required");
  }
  return workerUrl;
}

export const getCloesceApp = async (): Promise<CloesceApp> => {
  const workerUrl = getCloesceWorkerUrl();

  // In dev mode, don't cache to avoid stale I/O references after HMR
  if (process.env.NODE_ENV === "development") {
    // cidl is loaded from JSON, type assertion needed since CloesceAst type isn't exported
    return CloesceApp.init(cidl as any, constructorRegistry, workerUrl);
  }

  if (!appPromise) {
    // cidl is loaded from JSON, type assertion needed since CloesceAst type isn't exported
    appPromise = CloesceApp.init(cidl as any, constructorRegistry, workerUrl);
  }

  return appPromise;
};

export const getCloesceOrm = async (workerEnv: unknown): Promise<Orm> => {
  await getCloesceApp();
  return Orm.fromEnv(workerEnv);
};
