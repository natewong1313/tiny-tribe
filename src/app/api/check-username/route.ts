import { env } from "cloudflare:workers";
import { Orm } from "cloesce/backend";
import { BetterAuthUser } from "@/data/models.cloesce";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");

  if (!username) {
    return Response.json({ error: "Username is required" }, { status: 400 });
  }

  // Validate username format
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return Response.json({ error: "Invalid username format" }, { status: 400 });
  }

  try {
    const orm = Orm.fromEnv(env);
    const normalized = username.toLowerCase();
    const users = await orm.list(BetterAuthUser);
    const exists = users.some(
      (user) => user.username.toLowerCase() === normalized,
    );

    return Response.json({
      available: !exists,
      username: username,
    });
  } catch (error) {
    console.error("Error checking username:", error);
    return Response.json(
      { error: "Failed to check username availability" },
      { status: 500 },
    );
  }
}
