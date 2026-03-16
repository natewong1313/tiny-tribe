"use server";

import { User } from "@/data/models.cloesce";
import { getAuth } from "@/lib/auth-server";
import { getCloesceOrm } from "@/lib/cloesce-runtime";
import { env } from "cloudflare:workers";
import { headers } from "vinext/shims/headers";

interface HasOnboardedResult {
  hasOnboarded: boolean;
  unauthorized?: boolean;
  error?: string;
}

export const hasOnboarded = async (): Promise<HasOnboardedResult> => {
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return { hasOnboarded: false, unauthorized: true };
  }

  const orm = await getCloesceOrm(env);
  const user = await orm.get(User, { primaryKey: { id: session.user.id } });
  if (!user) {
    return {
      hasOnboarded: false,
      unauthorized: false,
      error: "User does not exist",
    };
  }

  const needsOnboarding = !user.name || !user.username || !user.photo;
  return { hasOnboarded: !needsOnboarding };
};
