import { getAuth } from "@/lib/auth-server";

const handler = async (request: Request): Promise<Response> => {
  try {
    const auth = getAuth();
    return await auth.handler(request);
  } catch (error) {
    console.error("Auth handler error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};

export const DELETE = handler;
export const GET = handler;
export const OPTIONS = handler;
export const PATCH = handler;
export const POST = handler;
export const PUT = handler;
