import { DataSource, Get, HttpResult, Orm, Service } from "cloesce/backend";
import { User } from "./models.cloesce";
import { Env } from "./main.cloesce";
import { validateUsername } from "../lib/username";
import { getAuth } from "@/lib/auth-server";

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
}
