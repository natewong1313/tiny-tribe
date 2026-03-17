"use server";

import { fetchWithSession } from "@/lib/fetch";
import { UserAppService } from "@generated/client";

interface HasOnboardedResult {
  hasOnboarded: boolean;
  unauthorized?: boolean;
  error?: string;
}

export const hasOnboarded = async (): Promise<HasOnboardedResult> => {
  const result = await UserAppService.hasOnboarded(fetchWithSession);

  if (!result.ok) {
    if (result.status === 401) {
      return { hasOnboarded: false, unauthorized: true };
    }

    return {
      hasOnboarded: false,
      unauthorized: false,
      error: result.message || "Failed to check onboarding",
    };
  }

  return { hasOnboarded: Boolean(result.data) };
};
