import { DataSource, Get, HttpResult, Orm, Put, Service } from "cloesce/backend";
import { Friendship, Post, PostMedia, User } from "./models.cloesce";
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

  private normalizeLimit(limit: unknown, fallback: number, max: number): number {
    if (typeof limit !== "number" || !Number.isFinite(limit)) {
      return fallback;
    }

    return Math.max(1, Math.min(max, Math.floor(limit)));
  }

  private async loadFriendshipBetween(
    aUserId: string,
    bUserId: string,
  ): Promise<Friendship | null> {
    const orm = Orm.fromEnv(this.env);
    const friendshipsByPair: DataSource<Friendship> = {
      includeTree: {},
      list: (joined) => `
        WITH cte AS (${joined()})
        SELECT * FROM cte
        WHERE (
          requesterId = ?
          AND addresseeId = ?
        ) OR (
          requesterId = ?
          AND addresseeId = ?
        )
        ORDER BY created_at DESC
        LIMIT ?
      `,
      listParams: ["Offset", "LastSeen", "Offset", "LastSeen", "Limit"],
    };

    const matches = await orm.list(Friendship, {
      include: friendshipsByPair,
      offset: aUserId as unknown as number,
      lastSeen: { id: bUserId } as Partial<Friendship>,
      limit: 1,
    });

    return matches[0] ?? null;
  }

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

  @Put()
  async sendFriendRequest(targetUserId: string): Promise<HttpResult<Friendship>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    if (typeof targetUserId !== "string" || !targetUserId.trim()) {
      return HttpResult.fail(400, "Target user id is required");
    }

    if (targetUserId === userId) {
      return HttpResult.fail(400, "Cannot send a friend request to yourself");
    }

    const orm = Orm.fromEnv(this.env);
    const targetUser = await orm.get(User, {
      primaryKey: { id: targetUserId },
      include: {},
    });

    if (!targetUser) {
      return HttpResult.fail(404, "Target user not found");
    }

    const existing = await this.loadFriendshipBetween(userId, targetUserId);
    if (existing) {
      if (existing.status === "blocked") {
        return HttpResult.fail(403, "Friendship actions are blocked between these users");
      }

      if (existing.status === "accepted") {
        return HttpResult.fail(409, "You are already friends");
      }

      return HttpResult.fail(409, "A friend request already exists");
    }

    const now = new Date();
    const created = await orm.upsert(
      Friendship,
      {
        id: crypto.randomUUID(),
        requesterId: userId,
        addresseeId: targetUserId,
        status: "pending",
        responded_at: null,
        created_at: now,
        updated_at: now,
      },
      {},
    );

    if (!created) {
      return HttpResult.fail(500, "Failed to create friend request");
    }

    return HttpResult.ok(200, created);
  }

  @Put()
  async acceptFriendRequest(friendshipId: string): Promise<HttpResult<Friendship>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    if (typeof friendshipId !== "string" || !friendshipId.trim()) {
      return HttpResult.fail(400, "Friendship id is required");
    }

    const orm = Orm.fromEnv(this.env);
    const friendship = await orm.get(Friendship, {
      primaryKey: { id: friendshipId },
      include: {},
    });

    if (!friendship) {
      return HttpResult.fail(404, "Friend request not found");
    }

    if (friendship.addresseeId !== userId) {
      return HttpResult.fail(403, "Only the recipient can accept this friend request");
    }

    if (friendship.status !== "pending") {
      return HttpResult.fail(409, "Only pending requests can be accepted");
    }

    const now = new Date();
    const updated = await orm.upsert(
      Friendship,
      {
        id: friendship.id,
        requesterId: friendship.requesterId,
        addresseeId: friendship.addresseeId,
        status: "accepted",
        responded_at: now,
        created_at: friendship.created_at,
        updated_at: now,
      },
      {},
    );

    if (!updated) {
      return HttpResult.fail(500, "Failed to accept friend request");
    }

    return HttpResult.ok(200, updated);
  }

  @Put()
  async rejectFriendRequest(friendshipId: string): Promise<HttpResult<void>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    if (typeof friendshipId !== "string" || !friendshipId.trim()) {
      return HttpResult.fail(400, "Friendship id is required");
    }

    const orm = Orm.fromEnv(this.env);
    const friendship = await orm.get(Friendship, {
      primaryKey: { id: friendshipId },
      include: {},
    });

    if (!friendship) {
      return HttpResult.fail(404, "Friend request not found");
    }

    if (friendship.addresseeId !== userId) {
      return HttpResult.fail(403, "Only the recipient can reject this friend request");
    }

    if (friendship.status !== "pending") {
      return HttpResult.fail(409, "Only pending requests can be rejected");
    }

    await this.env.db.prepare(`DELETE FROM "Friendship" WHERE "id" = ?`).bind(friendship.id).run();

    return HttpResult.ok(200);
  }

  @Put()
  async blockUser(targetUserId: string): Promise<HttpResult<Friendship>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    if (typeof targetUserId !== "string" || !targetUserId.trim()) {
      return HttpResult.fail(400, "Target user id is required");
    }

    if (targetUserId === userId) {
      return HttpResult.fail(400, "Cannot block yourself");
    }

    const orm = Orm.fromEnv(this.env);
    const targetUser = await orm.get(User, {
      primaryKey: { id: targetUserId },
      include: {},
    });

    if (!targetUser) {
      return HttpResult.fail(404, "Target user not found");
    }

    await this.env.db
      .prepare(
        `
          DELETE FROM "Friendship"
          WHERE (
            "requesterId" = ?
            AND "addresseeId" = ?
          ) OR (
            "requesterId" = ?
            AND "addresseeId" = ?
          )
        `,
      )
      .bind(userId, targetUserId, targetUserId, userId)
      .run();

    const now = new Date();
    const blocked = await orm.upsert(
      Friendship,
      {
        id: crypto.randomUUID(),
        requesterId: userId,
        addresseeId: targetUserId,
        status: "blocked",
        responded_at: now,
        created_at: now,
        updated_at: now,
      },
      {},
    );

    if (!blocked) {
      return HttpResult.fail(500, "Failed to block user");
    }

    return HttpResult.ok(200, blocked);
  }

  @Get()
  async listPendingIncoming(limit?: number): Promise<HttpResult<Friendship[]>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    const normalizedLimit = this.normalizeLimit(limit, 50, 200);
    const orm = Orm.fromEnv(this.env);
    const incomingPending: DataSource<Friendship> = {
      includeTree: {},
      list: (joined) => `
        WITH cte AS (${joined()})
        SELECT * FROM cte
        WHERE addresseeId = ?
          AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT ?
      `,
      listParams: ["Offset", "Limit"],
    };

    const friendships = await orm.list(Friendship, {
      include: incomingPending,
      offset: userId as unknown as number,
      limit: normalizedLimit,
    });

    return HttpResult.ok(200, friendships);
  }

  @Get()
  async listPendingOutgoing(limit?: number): Promise<HttpResult<Friendship[]>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    const normalizedLimit = this.normalizeLimit(limit, 50, 200);
    const orm = Orm.fromEnv(this.env);
    const outgoingPending: DataSource<Friendship> = {
      includeTree: {},
      list: (joined) => `
        WITH cte AS (${joined()})
        SELECT * FROM cte
        WHERE requesterId = ?
          AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT ?
      `,
      listParams: ["Offset", "Limit"],
    };

    const friendships = await orm.list(Friendship, {
      include: outgoingPending,
      offset: userId as unknown as number,
      limit: normalizedLimit,
    });

    return HttpResult.ok(200, friendships);
  }

  @Get()
  async listFriends(limit?: number): Promise<HttpResult<User[]>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    const normalizedLimit = this.normalizeLimit(limit, 100, 500);
    const orm = Orm.fromEnv(this.env);
    const friendsByUserId: DataSource<User> = {
      includeTree: {},
      list: (joined) => `
        WITH cte AS (${joined()})
        SELECT DISTINCT cte.*
        FROM cte
        INNER JOIN "Friendship"
          ON (
            "Friendship"."status" = 'accepted'
            AND (
              ("Friendship"."requesterId" = ? AND cte."id" = "Friendship"."addresseeId")
              OR ("Friendship"."addresseeId" = ? AND cte."id" = "Friendship"."requesterId")
            )
          )
        ORDER BY cte.created_at DESC
        LIMIT ?
      `,
      listParams: ["Offset", "LastSeen", "Limit"],
    };

    const friends = await orm.list(User, {
      include: friendsByUserId,
      offset: userId as unknown as number,
      lastSeen: { id: userId },
      limit: normalizedLimit,
    });

    return HttpResult.ok(200, friends);
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

  @Get()
  async createPost(text_content: string, mediaCount: number = 0): Promise<HttpResult<Post>> {
    const userId = await this.getUserId();
    if (!userId) {
      return HttpResult.fail(401, "Unauthorized");
    }

    if (!text_content || text_content.trim().length === 0) {
      return HttpResult.fail(400, "Post content is required");
    }

    const orm = Orm.fromEnv(this.env);
    const now = new Date().toISOString();

    try {
      // 1. Create the Post first
      const post = await orm.upsert(Post, {
        id: crypto.randomUUID(),
        text_content: text_content.trim(),
        userId,
        created_at: now,
        updated_at: now,
      });

      if (!post) {
        return HttpResult.fail(500, "Failed to create post");
      }

      // 2. Create PostMedia entries in parallel if there are media items
      if (mediaCount > 0) {
        const mediaPromises = Array.from({ length: mediaCount }, () =>
          orm.upsert(PostMedia, {
            id: crypto.randomUUID(),
            postId: post.id,
            created_at: now,
            updated_at: now,
          }),
        );

        await Promise.all(mediaPromises);
      }

      return HttpResult.ok(201, post);
    } catch (error) {
      return HttpResult.fail(500, error instanceof Error ? error.message : "Failed to create post");
    }
  }
}
