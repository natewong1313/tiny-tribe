import { getAuth } from "@/lib/auth-server";

const handler = async (request: Request): Promise<Response> => {
  const auth = getAuth();
  return auth.handler(request);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
