import { Model, WranglerEnv } from "cloesce/backend";
import { D1Database, R2Bucket } from "@cloudflare/workers-types";

@WranglerEnv
export class Env {
  db!: D1Database;
  bucket!: R2Bucket;
}

@Model()
export class BetterAuthUser {
  id!: string;
  name!: string;
  email!: string;
  email_verified!: boolean;
  image!: string | null;
  username!: string;
  created_at!: Date;
  updated_at!: Date;
}

@Model()
export class BetterAuthSession {
  id!: string;
  expires_at!: Date;
  token!: string;
  created_at!: Date;
  updated_at!: Date;
  ip_address!: string | null;
  user_agent!: string | null;
  user_id!: string;
}

@Model()
export class BetterAuthAccount {
  id!: string;
  account_id!: string;
  provider_id!: string;
  user_id!: string;
  access_token!: string | null;
  refresh_token!: string | null;
  id_token!: string | null;
  access_token_expires_at!: Date | null;
  refresh_token_expires_at!: Date | null;
  scope!: string | null;
  password!: string | null;
  created_at!: Date;
  updated_at!: Date;
}

@Model()
export class BetterAuthVerification {
  id!: string;
  identifier!: string;
  value!: string;
  expires_at!: Date;
  created_at!: Date;
  updated_at!: Date;
}
