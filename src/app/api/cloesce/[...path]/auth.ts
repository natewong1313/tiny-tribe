import cidl from "@generated/cidl.json";
import * as models from "@/data/models.cloesce";
import { getAuth } from "@/lib/auth-server";
import { getCloesceOrm } from "@/lib/cloesce-runtime";
import { validateUsername } from "@/lib/username";
import { env } from "cloudflare:workers";

interface RouteInfo {
  kind: "model" | "service";
  methodName: string;
  namespace: string;
  keys: string[];
  expectedVerb: string;
}

interface ModelAuthPolicy {
  internal?: boolean;
  allowMethods?: string[];
  ownerField?: string;
  ownerRelation?: {
    relationField: string;
    relationModel: string;
    relationOwnerField: string;
  };
  save?: {
    idField?: string;
    validateUsername?: boolean;
  };
  customPathOwnerMethods?: string[];
}

type ModelCtorWithAuth = {
  new (): unknown;
  authPolicy?: () => ModelAuthPolicy;
};

const AST = cidl as {
  models: Record<string, { methods: Record<string, { http_verb?: string }> }>;
  services: Record<string, { methods: Record<string, { http_verb?: string }> }>;
};

const MODEL_REGISTRY: Record<string, ModelCtorWithAuth> = Object.fromEntries(
  Object.entries(models).filter(([exportName, value]) => {
    return exportName in AST.models && typeof value === "function";
  }),
) as Record<string, ModelCtorWithAuth>;

const SERVICE_ALLOWED_METHODS: Record<string, Set<string>> = {
  PostAppService: new Set(["listMyPosts", "listMyPostMedia", "searchPostsByText"]),
  UserAppService: new Set([
    "hasOnboarded",
    "isUsernameAvailable",
    "getProfileWithPhoto",
    "searchUsers",
  ]),
};

const badRequest = () => new Response("Bad Request", { status: 400 });
const unauthorized = () => new Response("Unauthorized", { status: 401 });
const forbidden = () => new Response("Forbidden", { status: 403 });
const methodNotAllowed = () => new Response("Method Not Allowed", { status: 405 });

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

  const model = AST.models[namespace];
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

  const service = AST.services[namespace];
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

const parseModelFromSaveRequest = async (
  request: Request,
): Promise<Record<string, unknown> | null> => {
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

const loadModelById = async (
  modelCtor: ModelCtorWithAuth,
  idField: string,
  id: string,
): Promise<Record<string, unknown> | null> => {
  const orm = await getCloesceOrm(env);
  return (await orm.get(modelCtor as any, {
    primaryKey: {
      [idField]: id,
    },
  })) as Record<string, unknown> | null;
};

const ownsRelatedRecord = async (
  policy: ModelAuthPolicy,
  record: Record<string, unknown>,
  userId: string,
): Promise<boolean> => {
  const ownerRelation = policy.ownerRelation;
  if (!ownerRelation) {
    return false;
  }

  const relationId = record[ownerRelation.relationField];
  if (typeof relationId !== "string") {
    return false;
  }

  const relationCtor = MODEL_REGISTRY[ownerRelation.relationModel];
  if (!relationCtor) {
    return false;
  }

  const relationRecord = await loadModelById(relationCtor, "id", relationId);
  if (!relationRecord) {
    return false;
  }

  const relationOwnerValue = relationRecord[ownerRelation.relationOwnerField];
  return typeof relationOwnerValue === "string" && relationOwnerValue === userId;
};

const ownsRecord = async (
  policy: ModelAuthPolicy,
  record: Record<string, unknown>,
  userId: string,
): Promise<boolean> => {
  if (policy.ownerField) {
    const ownerValue = record[policy.ownerField];
    return typeof ownerValue === "string" && ownerValue === userId;
  }

  if (policy.ownerRelation) {
    return ownsRelatedRecord(policy, record, userId);
  }

  return false;
};

const ownsCreateInput = async (
  policy: ModelAuthPolicy,
  model: Record<string, unknown>,
  userId: string,
): Promise<boolean> => {
  if (policy.ownerField) {
    const ownerValue = model[policy.ownerField];
    return typeof ownerValue === "string" && ownerValue === userId;
  }

  if (policy.ownerRelation) {
    return ownsRelatedRecord(policy, model, userId);
  }

  return false;
};

const authorizeModelRequest = async (
  request: Request,
  route: RouteInfo,
  userId: string,
): Promise<Response | null> => {
  const modelCtor = MODEL_REGISTRY[route.namespace];
  if (!modelCtor) {
    return forbidden();
  }

  const policy = modelCtor.authPolicy?.();
  if (!policy || policy.internal) {
    return forbidden();
  }

  const allowedMethods = policy.allowMethods ?? [];
  if (!allowedMethods.includes(route.methodName)) {
    return forbidden();
  }

  const idField = policy.save?.idField ?? "id";

  if (route.methodName === "GET") {
    if (route.keys.length > 0) {
      return badRequest();
    }

    const queryId = new URL(request.url).searchParams.get(idField);
    if (!queryId) {
      return badRequest();
    }

    const existing = await loadModelById(modelCtor, idField, queryId);
    if (!existing) {
      return null;
    }

    return (await ownsRecord(policy, existing, userId)) ? null : forbidden();
  }

  if (route.methodName === "SAVE") {
    if (route.keys.length > 0) {
      return badRequest();
    }

    const model = await parseModelFromSaveRequest(request);
    if (!model) {
      return badRequest();
    }

    if (policy.save?.validateUsername && model.username !== undefined) {
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

    const id = model[idField];
    if (id !== undefined && id !== null) {
      if (typeof id !== "string") {
        return badRequest();
      }

      const existing = await loadModelById(modelCtor, idField, id);
      if (existing) {
        return (await ownsRecord(policy, existing, userId)) ? null : forbidden();
      }
    }

    return (await ownsCreateInput(policy, model, userId)) ? null : forbidden();
  }

  if (policy.customPathOwnerMethods?.includes(route.methodName)) {
    if (route.keys.length !== 1) {
      return badRequest();
    }

    const routeId = route.keys[0];
    if (policy.ownerField === idField) {
      return routeId === userId ? null : forbidden();
    }

    const existing = await loadModelById(modelCtor, idField, routeId);
    if (!existing) {
      return null;
    }

    return (await ownsRecord(policy, existing, userId)) ? null : forbidden();
  }

  return forbidden();
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

export const authorizeCloesceRequest = async (request: Request): Promise<Response | null> => {
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
