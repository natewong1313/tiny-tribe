import cidl from "@generated/cidl.json";
import { getAuth } from "@/lib/auth-server";
import { getCloesceApp } from "@/lib/cloesce-runtime";
import { validateUsername } from "@/lib/username";
import type { CloesceApp } from "cloesce/backend";
import { env } from "cloudflare:workers";

interface RouteInfo {
  kind: "model" | "service";
  methodName: string;
  namespace: string;
  keys: string[];
  expectedVerb: string;
}

const PROTECTED_MODELS = new Set([
  "BetterAuthAccount",
  "BetterAuthSession",
  "BetterAuthUser",
  "BetterAuthVerification",
]);

const MODEL_ALLOWED_METHODS: Record<string, Set<string>> = {
  Post: new Set(["GET", "SAVE"]),
  PostMedia: new Set(["GET", "SAVE"]),
  User: new Set(["GET", "SAVE", "downloadPhoto", "uploadPhoto"]),
};

const SERVICE_ALLOWED_METHODS: Record<string, Set<string>> = {
  UserAppService: new Set(["hasOnboarded", "isUsernameAvailable"]),
};

const badRequest = () => new Response("Bad Request", { status: 400 });
const unauthorized = () => new Response("Unauthorized", { status: 401 });
const forbidden = () => new Response("Forbidden", { status: 403 });
const methodNotAllowed = () => new Response("Method Not Allowed", { status: 405 });

const getApp = async (): Promise<CloesceApp> => getCloesceApp();

const findMethod = (
  methods: Record<string, { http_verb?: string }>,
  requestedMethodName: string,
): { methodName: string; expectedVerb: string } | null => {
  const exact = methods[requestedMethodName];
  if (exact?.http_verb) {
    return {
      methodName: requestedMethodName,
      expectedVerb: exact.http_verb.toUpperCase(),
    };
  }

  const uppercase = requestedMethodName.toUpperCase();
  const upper = methods[uppercase];
  if (upper?.http_verb) {
    return {
      methodName: uppercase,
      expectedVerb: upper.http_verb.toUpperCase(),
    };
  }

  return null;
};

const parseRoute = (request: Request): RouteInfo | null => {
  const { pathname } = new URL(request.url);
  const prefix = "/api/cloesce/";
  if (!pathname.startsWith(prefix)) {
    return null;
  }

  const segments = pathname.slice(prefix.length).split("/").filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  const namespace = segments[0];
  const requestedMethodName = segments[segments.length - 1];
  const keys = segments.length > 2 ? segments.slice(1, -1).map(decodeURIComponent) : [];
  if (!namespace || !requestedMethodName) {
    return null;
  }

  const ast = cidl as {
    models: Record<string, { methods: Record<string, { http_verb?: string }> }>;
    services: Record<string, { methods: Record<string, { http_verb?: string }> }>;
  };

  const model = ast.models[namespace];
  if (model) {
    const found = findMethod(model.methods, requestedMethodName);
    if (!found) {
      return null;
    }

    return {
      kind: "model",
      methodName: found.methodName,
      namespace,
      keys,
      expectedVerb: found.expectedVerb,
    };
  }

  const service = ast.services[namespace];
  if (!service) {
    return null;
  }

  const found = findMethod(service.methods, requestedMethodName);
  if (!found) {
    return null;
  }

  return {
    kind: "service",
    methodName: found.methodName,
    namespace,
    keys,
    expectedVerb: found.expectedVerb,
  };
};

const isPostOwnedByUser = async (postId: string, userId: string): Promise<boolean> => {
  const postResult = await env.db
    .prepare('SELECT "userId" FROM "Post" WHERE "id" = ? LIMIT 1')
    .bind(postId)
    .all();
  const ownerId = (postResult.results[0] as { userId?: unknown } | undefined)?.userId;
  return typeof ownerId === "string" && ownerId === userId;
};

const isPostMediaOwnedByUser = async (postMediaId: string, userId: string): Promise<boolean> => {
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

const authorizeModelRequest = async (
  request: Request,
  route: RouteInfo,
  userId: string,
): Promise<Response | null> => {
  if (PROTECTED_MODELS.has(route.namespace)) {
    return forbidden();
  }

  const allowedMethods = MODEL_ALLOWED_METHODS[route.namespace];
  if (!allowedMethods || !allowedMethods.has(route.methodName)) {
    return forbidden();
  }

  if (route.methodName === "GET") {
    if (route.keys.length > 0) {
      return badRequest();
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return badRequest();
    }

    if (route.namespace === "User" && id !== userId) {
      return forbidden();
    }

    if (route.namespace === "Post" && !(await isPostOwnedByUser(id, userId))) {
      return forbidden();
    }

    if (route.namespace === "PostMedia" && !(await isPostMediaOwnedByUser(id, userId))) {
      return forbidden();
    }

    return null;
  }

  if (route.methodName === "SAVE") {
    if (route.keys.length > 0) {
      return badRequest();
    }

    const model = await parseModelFromSaveRequest(request);
    if (!model) {
      return badRequest();
    }

    if (route.namespace === "User") {
      const id = model.id;
      if (typeof id !== "string" || id !== userId) {
        return forbidden();
      }

      if (model.username !== undefined) {
        if (typeof model.username !== "string") {
          return badRequest();
        }

        if (model.username.length > 0) {
          const validation = validateUsername(model.username);
          if (!validation.valid) {
            return new Response(validation.error ?? "Invalid username", { status: 400 });
          }
        }
      }

      return null;
    }

    if (route.namespace === "Post") {
      const postId = model.id;
      if (postId !== undefined && typeof postId !== "string") {
        return badRequest();
      }

      if (typeof postId === "string" && !(await isPostOwnedByUser(postId, userId))) {
        return forbidden();
      }

      const postUserId = model.userId;
      if (postUserId !== undefined && (typeof postUserId !== "string" || postUserId !== userId)) {
        return forbidden();
      }

      if (postId === undefined && postUserId !== userId) {
        return forbidden();
      }

      return null;
    }

    if (route.namespace === "PostMedia") {
      const postMediaId = model.id;
      if (postMediaId !== undefined && typeof postMediaId !== "string") {
        return badRequest();
      }

      if (typeof postMediaId === "string" && !(await isPostMediaOwnedByUser(postMediaId, userId))) {
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

      if (!(await isPostOwnedByUser(postId, userId))) {
        return forbidden();
      }

      return null;
    }

    return forbidden();
  }

  if (route.methodName === "uploadPhoto" || route.methodName === "downloadPhoto") {
    if (route.namespace !== "User") {
      return forbidden();
    }

    if (route.keys.length !== 1 || route.keys[0] !== userId) {
      return forbidden();
    }

    return null;
  }

  return null;
};

const authorizeServiceRequest = (route: RouteInfo): Response | null => {
  if (route.keys.length > 0) {
    return badRequest();
  }

  const allowedMethods = SERVICE_ALLOWED_METHODS[route.namespace];
  if (!allowedMethods || !allowedMethods.has(route.methodName)) {
    return forbidden();
  }

  return null;
};

const authorizeCloesceRequest = async (request: Request): Promise<Response | null> => {
  if (request.method === "OPTIONS") {
    return null;
  }

  const route = parseRoute(request);
  if (!route) {
    return badRequest();
  }

  if (request.method.toUpperCase() !== route.expectedVerb) {
    return methodNotAllowed();
  }

  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) {
    return unauthorized();
  }

  if (route.kind === "service") {
    return authorizeServiceRequest(route);
  }

  return authorizeModelRequest(request, route, userId);
};

const handler = async (request: Request): Promise<Response> => {
  const authorizationError = await authorizeCloesceRequest(request);
  if (authorizationError) {
    return authorizationError;
  }

  const app = await getApp();
  const result = await app.run(request, env);
  if (!result.ok) {
    const body = await result.text();
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
