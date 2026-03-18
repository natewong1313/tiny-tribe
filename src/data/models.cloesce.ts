import {
  Crud,
  ForeignKey,
  Get,
  HttpResult,
  Inject,
  Model,
  PrimaryKey,
  Put,
  R2,
} from "cloesce/backend";
import { R2ObjectBody, ReadableStream } from "@cloudflare/workers-types";
import { Env } from "./main.cloesce";

@Model("db")
@Crud("SAVE", "GET")
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
  sentFriendRequests!: Friendship[];
  receivedFriendRequests!: Friendship[];

  @R2("user/photos/{id}.png", "bucket")
  photo!: R2ObjectBody | undefined;

  @Put()
  async uploadPhoto(@Inject env: Env, stream: ReadableStream): Promise<HttpResult<void>> {
    await env.bucket.put(`user/photos/${this.id}.png`, stream);
    return HttpResult.ok(200);
  }

  @Get({ includeTree: { photo: {} } })
  downloadPhoto(): HttpResult<ReadableStream> {
    if (!this.photo) {
      return HttpResult.fail(404, "Photo not found");
    }
    return HttpResult.ok(200, this.photo.body);
  }
}

@Model("db")
@Crud("SAVE", "GET")
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

  static fromJson(data: any): Post {
    return Object.assign(new Post(), data);
  }
}

@Model("db")
@Crud("SAVE", "GET")
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

  static fromJson(data: any): PostMedia {
    return Object.assign(new PostMedia(), data);
  }
}

@Model("db")
export class Friendship {
  @PrimaryKey
  id!: string;

  @ForeignKey<User>((u) => u.id)
  requesterId!: string;
  requester!: User;

  @ForeignKey<User>((u) => u.id)
  addresseeId!: string;
  addressee!: User;

  status!: string;
  responded_at!: Date | null;
  created_at!: Date;
  updated_at!: Date;

  static fromJson(data: any): Friendship {
    return Object.assign(new Friendship(), data);
  }
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
