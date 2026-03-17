import { getCloesceApp } from "@/lib/cloesce-runtime";
import { getAuth } from "@/lib/auth-server";
import { validateUsername } from "@/lib/username";
import type { CloesceApp } from "cloesce/backend";
import { env } from "cloudflare:workers";

const getApp = async (): Promise<CloesceApp> => getCloesceApp();

const MODEL_METHOD_HTTP_VERB: Record<string, string> = {
  GET: "GET",
  LIST: "GET",
  SAVE: "POST",
};

const PROTECTED_MODELS = new Set([
  "BetterAuthAccount",
  "BetterAuthSession",
  "BetterAuthUser",
  "BetterAuthVerification",
]);

const MODEL_ALLOWED_METHODS: Record<string, Set<string>> = {
  Post: new Set(["GET", "SAVE"]),
  PostMedia: new Set(["GET", "SAVE"]),
  User: new Set(["GET", "SAVE", "DOWNLOADPHOTO", "UPLOADPHOTO"]),
};

interface RouteInfo {
  method: string;
  model: string;
  keys: string[];
}

const parseModelAndMethod = (request: Request): RouteInfo | null => {
  const { pathname } = new URL(request.url);
  const prefix = "/api/cloesce/";
  if (!pathname.startsWith(prefix)) {
    return null;
  }

  const segments = pathname.slice(prefix.length).split("/").filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  const model = segments[0];
  const method = segments.length === 2 ? segments[1] : segments[segments.length - 1];
  const keys = segments.length > 2 ? segments.slice(1, -1).map((part) => decodeURIComponent(part)) : [];

  if (!model || !method) {
    return null;
  }

  return {
    method: method.toUpperCase(),
    model,
    keys,
  };
};

const forbidden = () => new Response("Forbidden", { status: 403 });
const unauthorized = () => new Response("Unauthorized", { status: 401 });
const badRequest = () => new Response("Bad Request", { status: 400 });
const methodNotAllowed = () => new Response("Method Not Allowed", { status: 405 });

const isPostOwnedByUser = async (postId: string, userId: string): Promise<boolean> => {
  const postResult = await env.db
    .prepare('SELECT "userId" FROM "Post" WHERE "id" = ? LIMIT 1')
    .bind(postId)
    .all();
  const ownerId = (postResult.results[0] as { userId?: unknown } | undefined)?.userId;
  return typeof ownerId === "string" && ownerId === userId;
};

const isPostMediaOwnedByUser = async (
  postMediaId: string,
  userId: string,
): Promise<boolean> => {
  const mediaResult = await env.db
    .prepare(
      'SELECT "Post"."userId" as "userId" FROM "PostMedia" INNER JOIN "Post" ON "Post"."id" = "PostMedia"."postId" WHERE "PostMedia"."id" = ? LIMIT 1',
    )
    .bind(postMediaId)
    .all();
  const ownerId = (mediaResult.results[0] as { userId?: unknown } | undefined)?.userId;
  return typeof ownerId === "string" && ownerId === userId;
};

const parseModelFromSaveRequest = async (request: Request): Promise<Record<string, unknown> | null> => {
  let body: unknown;
  try {
    body = await request.clone().json();
  } catch {
    return null;
  }

  if (typeof body !== "object" || body === null) {
    return null;
  }

  const model = (body as { model?: unknown }).model;
  if (typeof model !== "object" || model === null) {
    return null;
  }

  return model as Record<string, unknown>;
};

const CUSTOM_METHOD_HTTP_VERB: Record<string, string> = {
  DOWNLOADPHOTO: "GET",
  UPLOADPHOTO: "PUT",
};

const authorizeCloesceRequest = async (request: Request): Promise<Response | null> => {
  if (request.method === "OPTIONS") {
    return null;
  }

  const routeInfo = parseModelAndMethod(request);
  if (!routeInfo) {
    return badRequest();
  }

  const expectedVerb = MODEL_METHOD_HTTP_VERB[routeInfo.method] ?? CUSTOM_METHOD_HTTP_VERB[routeInfo.method];
  if (!expectedVerb || expectedVerb !== request.method.toUpperCase()) {
    return methodNotAllowed();
  }

  if (PROTECTED_MODELS.has(routeInfo.model)) {
    return forbidden();
  }

  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return unauthorized();
  }

  const allowedMethods = MODEL_ALLOWED_METHODS[routeInfo.model];
  if (!allowedMethods || !allowedMethods.has(routeInfo.method)) {
    return forbidden();
  }

  if (routeInfo.method === "GET") {
    if (routeInfo.keys.length > 0) {
      return badRequest();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return badRequest();
    }

    if (routeInfo.model === "User" && id !== session.user.id) {
      return forbidden();
    }

    if (routeInfo.model === "Post" && !(await isPostOwnedByUser(id, session.user.id))) {
      return forbidden();
    }

    if (routeInfo.model === "PostMedia" && !(await isPostMediaOwnedByUser(id, session.user.id))) {
      return forbidden();
    }

    return null;
  }

  if (routeInfo.method === "SAVE") {
    if (routeInfo.keys.length > 0) {
      return badRequest();
    }

    const model = await parseModelFromSaveRequest(request);
    if (!model) {
      return badRequest();
    }

    if (routeInfo.model === "User") {
      const id = model.id;
      if (typeof id !== "string" || id !== session.user.id) {
        return forbidden();
      }

      if (model.username !== undefined) {
        if (typeof model.username !== "string") {
          return badRequest();
        }

        if (model.username.length > 0) {
          const validation = validateUsername(model.username);
          if (!validation.valid) {
            return new Response(validation.error ?? "Invalid username", {
              status: 400,
            });
          }
        }
      }

      return null;
    }

    if (routeInfo.model === "Post") {
      const postId = model.id;
      if (postId !== undefined && typeof postId !== "string") {
        return badRequest();
      }

      if (typeof postId === "string" && !(await isPostOwnedByUser(postId, session.user.id))) {
        return forbidden();
      }

      const postUserId = model.userId;
      if (postUserId !== undefined && (typeof postUserId !== "string" || postUserId !== session.user.id)) {
        return forbidden();
      }

      if (postId === undefined && postUserId !== session.user.id) {
        return forbidden();
      }

      return null;
    }

    if (routeInfo.model === "PostMedia") {
      const postMediaId = model.id;
      if (postMediaId !== undefined && typeof postMediaId !== "string") {
        return badRequest();
      }

      if (typeof postMediaId === "string" && !(await isPostMediaOwnedByUser(postMediaId, session.user.id))) {
        return forbidden();
      }

      const postId = model.postId;
      if (postId === undefined) {
        if (typeof postMediaId === "string") {
          return null;
        }

        return badRequest();
      }

      if (typeof postId !== "string") {
        return badRequest();
      }

      if (!(await isPostOwnedByUser(postId, session.user.id))) {
        return forbidden();
      }
      return null;
    }

    return forbidden();
  }

  if (routeInfo.method === "UPLOADPHOTO") {
    if (routeInfo.model !== "User") {
      return forbidden();
    }

    if (routeInfo.keys.length !== 1 || routeInfo.keys[0] !== session.user.id) {
      return forbidden();
    }

    return null;
  }

  if (routeInfo.method === "DOWNLOADPHOTO") {
    if (routeInfo.model !== "User") {
      return forbidden();
    }

    if (routeInfo.keys.length !== 1 || routeInfo.keys[0] !== session.user.id) {
      return forbidden();
    }

    return null;
  }

  return null;
};

const handler = async (request: Request): Promise<Response> => {
  console.log("[Cloesce] Handling request:", request.method, request.url);
  
  const authorizationError = await authorizeCloesceRequest(request);
  if (authorizationError) {
    console.log("[Cloesce] Authorization failed:", authorizationError.status);
    return authorizationError;
  }

  console.log("[Cloesce] Authorization passed, running app...");
  const app = await getApp();
  const result = await app.run(request, env);
  
  if (!result.ok) {
    const body = await result.text();
    console.log("[Cloesce] App error:", result.status, body);
    return new Response(body, { status: result.status, headers: result.headers });
  }
  
  return result;
};

export const DELETE = handler;
export const GET = handler;
export const OPTIONS = handler;
export const PATCH = handler;
export const POST = handler;
export const PUT = handler;
