"use server";

import { UserAppService } from "@generated/client";
import { fetchWithSession } from "@/lib/fetch";

export const isUsernameAvailable = async (
  username: string,
): Promise<{ available: boolean; error?: string }> => {
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
