import { CloesceApp, Orm } from "cloesce/backend";
import cidl from "../../.generated/cidl.json";
import {
  BetterAuthAccount,
  BetterAuthSession,
  BetterAuthUser,
  BetterAuthVerification,
  Env as CloesceEnv,
  User,
} from "@/data/models.cloesce";

const constructorRegistry: Record<string, new () => any> = {
  BetterAuthUser,
  BetterAuthSession,
  BetterAuthAccount,
  BetterAuthVerification,
  User,
  Env: CloesceEnv,
};

const CLOESCE_WORKER_URL = "http://localhost:3000/api/cloesce";

let appPromise: Promise<CloesceApp> | null = null;

export async function getCloesceApp(): Promise<CloesceApp> {
  if (!appPromise) {
    appPromise = CloesceApp.init(cidl as any, constructorRegistry, CLOESCE_WORKER_URL);
  }

  return appPromise;
}

export async function getCloesceOrm(workerEnv: unknown): Promise<Orm> {
  await getCloesceApp();
  return Orm.fromEnv(workerEnv);
}
