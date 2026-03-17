import { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { WranglerEnv } from "cloesce/backend";

export class SessionId {
  value!: string;
}

@WranglerEnv
export class Env {
  db!: D1Database;
  bucket!: R2Bucket;

  BETTER_AUTH_SECRET!: string;
  BETTER_AUTH_URL!: string;
}
