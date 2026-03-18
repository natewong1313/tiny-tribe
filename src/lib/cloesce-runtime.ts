import {
  BetterAuthAccount,
  BetterAuthSession,
  BetterAuthUser,
  BetterAuthVerification,
  User,
  Post,
  PostMedia,
} from "@/data/models.cloesce";
import { Env as CloesceEnv } from "@/data/main.cloesce";
import { PostAppService, UserAppService } from "@/data/services.cloesce";
import { CloesceApp, Orm } from "cloesce/backend";
import cidl from "../../.generated/cidl.json";

interface ConstructorRegistry {
  [key: string]: new () => unknown;
}

const constructorRegistry: ConstructorRegistry = {
  BetterAuthAccount,
  BetterAuthSession,
  BetterAuthUser,
  BetterAuthVerification,
  Env: CloesceEnv,
  User,
  Post,
  PostMedia,
  PostAppService,
  UserAppService,
};

let appPromise: Promise<CloesceApp> | null = null;

export const getCloesceApp = async (): Promise<CloesceApp> => {
  // In dev mode, don't cache to avoid stale I/O references after HMR
  if (process.env.NODE_ENV === "development") {
    return CloesceApp.init(cidl as any, constructorRegistry, process.env.CLOESCE_WORKER_URL!);
  }

  if (!appPromise) {
    appPromise = CloesceApp.init(cidl as any, constructorRegistry, process.env.CLOESCE_WORKER_URL!);
  }

  return appPromise;
};

export const getCloesceOrm = async (workerEnv: unknown): Promise<Orm> => {
  await getCloesceApp();
  return Orm.fromEnv(workerEnv);
};
