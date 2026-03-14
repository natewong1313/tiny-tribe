import { Integer, Model, WranglerEnv } from "cloesce/backend";
import { D1Database } from "@cloudflare/workers-types";

@WranglerEnv
export class Env {
  db!: D1Database;
}

@Model(["SAVE", "GET", "LIST"])
export class User {
  id!: Integer;
  username!: string;
  email!: string;
}
