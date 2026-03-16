import { Crud, ForeignKey, Model, PrimaryKey, R2, WranglerEnv } from "cloesce/backend";
import { D1Database, R2Bucket, R2ObjectBody } from "@cloudflare/workers-types";

@WranglerEnv
export class Env {
  db!: D1Database;
  bucket!: R2Bucket;
}

@Model("db")
@Crud("SAVE", "GET", "LIST")
export class User {
  @PrimaryKey
  id!: string;
  name?: string;
  email!: string;
  email_verified!: boolean;
  image!: string | null;
  username?: string;
  created_at!: Date;
  updated_at!: Date;

  posts!: Post[];

  @R2("user/photos/{id}.png", "bucket")
  photo!: R2ObjectBody;
}

@Model("db")
@Crud("SAVE", "GET", "LIST")
export class Post {
  @PrimaryKey
  id!: string;
  @ForeignKey<User>((u) => u.id)
  userId!: string;
  user!: User;
  text_content!: string;
  created_at!: Date;
  updated_at!: Date;

  media!: PostMedia[];
}

@Model("db")
@Crud("SAVE", "GET", "LIST")
export class PostMedia {
  @PrimaryKey
  id!: string;

  @ForeignKey<Post>((p) => p.id)
  postId!: string;
  post!: Post;

  @R2("post/media/{postId}/{id}", "bucket")
  media!: R2ObjectBody;

  created_at!: Date;
  updated_at!: Date;
}

@Model("db")
export class BetterAuthUser {
  id!: string;
  name!: string;
  email!: string;
  email_verified!: boolean;
  image!: string | null;
  created_at!: Date;
  updated_at!: Date;
}

@Model("db")
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

@Model("db")
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

@Model("db")
export class BetterAuthVerification {
  id!: string;
  identifier!: string;
  value!: string;
  expires_at!: Date;
  created_at!: Date;
  updated_at!: Date;
}
