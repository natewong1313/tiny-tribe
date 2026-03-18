import { DataSource, Get, HttpResult, Orm, Service } from "cloesce/backend";
import { Post, PostMedia, User } from "./models.cloesce";
import { Env } from "./main.cloesce";
import { validateUsername } from "../lib/username";
import { getAuth } from "@/lib/auth-server";

export class ProfileWithPhotoResponse {
  user!: User;
  photoDataUrl!: string | null;
}

export class SearchUserWithPhotoResponse {
  user!: User;
  photoDataUrl!: string | null;
}

@Service
export class UserAppService {
  env!: Env;
  request!: Request;

  private async getUserId(): Promise<string | null> {
    const auth = getAuth();

    const session = await auth.api.getSession({
      headers: this.request.headers,
    });
    return session?.user?.id ?? null;
  }

  @Get()
  async hasOnboarded(): Promise<HttpResult<boolean>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    const orm = Orm.fromEnv(this.env);
    const user = await orm.get(User, {
      primaryKey: { id: userId },
      include: { photo: {} },
    });

    if (!user) {
      return HttpResult.fail(404, "User does not exist");
    }

    const needsOnboarding = !user.name || !user.username || !user.photo;

    return HttpResult.ok(200, !needsOnboarding);
  }

  @Get()
  async isUsernameAvailable(username: string): Promise<HttpResult<boolean>> {
    const validation = validateUsername(username);
    if (!validation.valid) {
      return HttpResult.fail(400, validation.error ?? "Invalid username");
    }

    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    const trimmedUsername = username.trim();
    const orm = Orm.fromEnv(this.env);
    const usernameLookupSource: DataSource<User> = {
      includeTree: {},
      list: (joined) => `
        WITH cte AS (${joined()})
        SELECT * FROM cte
        WHERE username = ?
          AND id != ?
        LIMIT ?
      `,
      listParams: ["Offset", "LastSeen", "Limit"],
    };
    const existingUsers = await orm.list(User, {
      include: usernameLookupSource,
      lastSeen: { id: userId },
      limit: 1,
      offset: trimmedUsername as unknown as number,
    });

    return HttpResult.ok(200, existingUsers.length === 0);
  }

  @Get()
  async getProfilePhoto(): Promise<HttpResult<string>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    const orm = Orm.fromEnv(this.env);
    const user = await orm.get(User, {
      primaryKey: { id: userId },
      include: { photo: {} },
    });

    if (!user) {
      return HttpResult.fail(404, "User not found");
    }

    if (!user.photo) {
      return HttpResult.fail(404, "Profile photo not found");
    }

    try {
      const arrayBuffer = await user.photo.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const dataUrl = `data:image/png;base64,${base64}`;
      return HttpResult.ok(200, dataUrl);
    } catch {
      return HttpResult.fail(500, "Failed to process photo");
    }
  }

  @Get()
  async getProfileWithPhoto(): Promise<HttpResult<ProfileWithPhotoResponse>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    const orm = Orm.fromEnv(this.env);
    const user = await orm.get(User, {
      primaryKey: { id: userId },
      include: { photo: {} },
    });

    if (!user) {
      return HttpResult.fail(404, "User not found");
    }

    let photoDataUrl: string | null = null;

    if (user.photo) {
      try {
        const arrayBuffer = await user.photo.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        photoDataUrl = `data:image/png;base64,${base64}`;
      } catch {
        // If photo processing fails, still return user without photo
      }
    }

    const result = new ProfileWithPhotoResponse();
    result.user = user;
    result.photoDataUrl = photoDataUrl;
    return HttpResult.ok(200, result);
  }

  @Get()
  async searchUsers(query: string, limit?: number): Promise<HttpResult<User[]>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    const trimmedQuery = typeof query === "string" ? query.trim() : "";
    if (!trimmedQuery) {
      return HttpResult.ok(200, []);
    }

    const normalizedLimit =
      typeof limit === "number" && Number.isFinite(limit)
        ? Math.max(1, Math.min(100, Math.floor(limit)))
        : 25;

    const searchPattern = `%${trimmedQuery.toLowerCase()}%`;
    const orm = Orm.fromEnv(this.env);
    const usersByQuery: DataSource<User> = {
      includeTree: {},
      list: (joined) => `
        WITH cte AS (${joined()})
        SELECT * FROM cte
        WHERE id != ?
          AND (
            LOWER(COALESCE(name, '')) LIKE ?
            OR LOWER(COALESCE(username, '')) LIKE ?
          )
        ORDER BY created_at DESC
        LIMIT ?
      `,
      listParams: ["LastSeen", "Offset", "Offset", "Limit"],
    };

    const users = await orm.list(User, {
      include: usersByQuery,
      lastSeen: { id: userId },
      offset: searchPattern as unknown as number,
      limit: normalizedLimit,
    });

    return HttpResult.ok(200, users);
  }

  @Get()
  async searchUsersWithPhoto(
    query: string,
    limit?: number,
  ): Promise<HttpResult<SearchUserWithPhotoResponse[]>> {
    const usersResult = await this.searchUsers(query, limit);

    if (!usersResult.ok) {
      return HttpResult.fail(usersResult.status, usersResult.message || "Failed to search users");
    }

    const orm = Orm.fromEnv(this.env);
    const users = usersResult.data ?? [];

    const usersWithPhoto = await Promise.all(
      users.map(async (user) => {
        let photoDataUrl: string | null = null;

        try {
          const userWithPhoto = await orm.get(User, {
            primaryKey: { id: user.id },
            include: { photo: {} },
          });

          if (userWithPhoto?.photo) {
            const arrayBuffer = await userWithPhoto.photo.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            photoDataUrl = `data:image/png;base64,${base64}`;
          }
        } catch {
          photoDataUrl = null;
        }

        const result = new SearchUserWithPhotoResponse();
        result.user = user;
        result.photoDataUrl = photoDataUrl;
        return result;
      }),
    );

    return HttpResult.ok(200, usersWithPhoto);
  }
}

@Service
export class PostAppService {
  env!: Env;
  request!: Request;

  private async getUserId(): Promise<string | null> {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: this.request.headers,
    });
    return session?.user?.id ?? null;
  }

  @Get()
  async listMyPosts(limit?: number): Promise<HttpResult<Post[]>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    const normalizedLimit =
      typeof limit === "number" && Number.isFinite(limit)
        ? Math.max(1, Math.min(100, Math.floor(limit)))
        : 25;

    const orm = Orm.fromEnv(this.env);
    const postsByOwner: DataSource<Post> = {
      includeTree: {},
      list: (joined) => `
        WITH cte AS (${joined()})
        SELECT * FROM cte
        WHERE userId = ?
        ORDER BY created_at DESC
        LIMIT ?
      `,
      listParams: ["Offset", "Limit"],
    };

    const posts = await orm.list(Post, {
      include: postsByOwner,
      offset: userId as unknown as number,
      limit: normalizedLimit,
    });

    return HttpResult.ok(200, posts);
  }

  @Get()
  async listMyPostMedia(limit?: number): Promise<HttpResult<PostMedia[]>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    const normalizedLimit =
      typeof limit === "number" && Number.isFinite(limit)
        ? Math.max(1, Math.min(200, Math.floor(limit)))
        : 50;

    const orm = Orm.fromEnv(this.env);
    const mediaByOwner: DataSource<PostMedia> = {
      includeTree: {},
      list: (joined) => `
        WITH cte AS (${joined()})
        SELECT cte.*
        FROM cte
        INNER JOIN "Post" ON "Post"."id" = cte."postId"
        WHERE "Post"."userId" = ?
        ORDER BY cte.created_at DESC
        LIMIT ?
      `,
      listParams: ["Offset", "Limit"],
    };

    const media = await orm.list(PostMedia, {
      include: mediaByOwner,
      offset: userId as unknown as number,
      limit: normalizedLimit,
    });

    return HttpResult.ok(200, media);
  }

  @Get()
  async searchPostsByText(query: string, limit?: number): Promise<HttpResult<Post[]>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    const trimmedQuery = typeof query === "string" ? query.trim() : "";
    if (!trimmedQuery) {
      return HttpResult.ok(200, []);
    }

    const normalizedLimit =
      typeof limit === "number" && Number.isFinite(limit)
        ? Math.max(1, Math.min(100, Math.floor(limit)))
        : 25;

    const searchPattern = `%${trimmedQuery.toLowerCase()}%`;
    const orm = Orm.fromEnv(this.env);
    const postsByQuery: DataSource<Post> = {
      includeTree: {},
      list: (joined) => `
        WITH cte AS (${joined()})
        SELECT * FROM cte
        WHERE LOWER(COALESCE(text_content, '')) LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `,
      listParams: ["Offset", "Limit"],
    };

    const posts = await orm.list(Post, {
      include: postsByQuery,
      offset: searchPattern as unknown as number,
      limit: normalizedLimit,
    });

    return HttpResult.ok(200, posts);
  }
}
