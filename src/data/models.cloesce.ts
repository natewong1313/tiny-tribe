import { Inject, Integer, Model, PUT, R2, WranglerEnv } from "cloesce/backend";
import {
  D1Database,
  R2Bucket,
  R2ObjectBody,
  ReadableStream,
} from "@cloudflare/workers-types";

@WranglerEnv
export class Env {
  db!: D1Database;
  bucket!: R2Bucket;
}

@Model(["SAVE", "GET", "LIST"])
export class User {
  id!: Integer;
  username!: string;
  email!: string;

  @R2("user/avatars/{id}.png", "bucket")
  avatar!: R2ObjectBody;

  @PUT
  async uploadAvatar(@Inject env: Env, stream: ReadableStream) {
    await env.bucket.put(`user/avatars/${this.id}.png`, stream);
  }
}
