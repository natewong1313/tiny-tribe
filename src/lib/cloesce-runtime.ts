import {
  BetterAuthAccount,
  BetterAuthSession,
  BetterAuthUser,
  BetterAuthVerification,
  Env as CloesceEnv,
  User,
} from "@/data/models.cloesce";
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
};

const CLOESCE_WORKER_URL = "http://localhost:3000/api/cloesce";

let appPromise: Promise<CloesceApp> | null = null;

export const getCloesceApp = async (): Promise<CloesceApp> => {
  if (!appPromise) {
    appPromise = CloesceApp.init(cidl as any, constructorRegistry, CLOESCE_WORKER_URL);
  }

  return appPromise;
};

export const getCloesceOrm = async (workerEnv: unknown): Promise<Orm> => {
  await getCloesceApp();
  return Orm.fromEnv(workerEnv);
};
