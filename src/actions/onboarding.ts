"use server";

import { getAuth } from "@/lib/auth-server";
import { User } from "@generated/client";
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

  const { data: user } = await User.GET(session.user.id);
  if (!user) {
    return {
      hasOnboarded: false,
      unauthorized: true,
      error: "User does not exist",
    };
  }

  const needsOnboarding = !user.name || !user.username || !user.photo;
  return { hasOnboarded: !needsOnboarding };
};
