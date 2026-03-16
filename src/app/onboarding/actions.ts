"use server";

import { User } from "@/data/models.cloesce";
import { getAuth } from "@/lib/auth-server";
import { getCloesceOrm } from "@/lib/cloesce-runtime";
import { env } from "cloudflare:workers";
import { headers } from "vinext/shims/headers";

interface OnboardingInput {
  name: string;
  username: string;
  photo: string;
}

interface OnboardingResult {
  success: boolean;
  error?: string;
}

export const completeOnboarding = async (
  input: OnboardingInput,
): Promise<OnboardingResult> => {
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  if (!input.name || !input.username || !input.photo) {
    return { success: false, error: "All fields are required" };
  }

  try {
    const orm = await getCloesceOrm(env);

    const result = await orm.upsert(
      User,
      {
        id: session.user.id,
        name: input.name,
        username: input.username,
        image: input.photo,
      },
      {},
    );

    if (!result) {
      return { success: false, error: "Failed to update profile" };
    }

    return { success: true };
  } catch (error) {
    console.error("Onboarding error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};
