"use server";

import { fetchWithSession } from "@/lib/fetch";
import { UserAppService } from "@generated/client";

interface UsernameAvailabilityResult {
  available: boolean;
  error?: string;
}

export const isUsernameAvailable = async (
  username: string,
): Promise<UsernameAvailabilityResult> => {
  const result = await UserAppService.isUsernameAvailable(
    username,
    fetchWithSession,
  );

  if (!result.ok) {
    return {
      available: false,
      error: result.message || "Failed to check username availability",
    };
  }

  return {
    available: Boolean(result.data),
  };
};
