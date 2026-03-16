"use server";

import { User } from "@/data/models.cloesce";
import { getAuth } from "@/lib/auth-server";
import { getCloesceOrm } from "@/lib/cloesce-runtime";
import { validateUsername } from "@/lib/username";
import type { DataSource } from "cloesce/backend";
import { env } from "cloudflare:workers";
import { headers } from "vinext/shims/headers";

interface UsernameAvailabilityResult {
  available: boolean;
  error?: string;
}

export const isUsernameAvailable = async (
  username: string,
): Promise<UsernameAvailabilityResult> => {
  const validation = validateUsername(username);
  if (!validation.valid) {
    return { available: false, error: validation.error };
  }

  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { available: false, error: "Unauthorized" };
  }

  const orm = await getCloesceOrm(env);
  const usernameLookupSource: DataSource<User> = {
    includeTree: {},
    list: (joined) => `
      WITH cte AS (${joined()})
      SELECT * FROM cte
      WHERE username = ?
        AND id != ?
      LIMIT ?
    `,
    listParams: ["Offset", "LastSeen", "Limit"],
  };

  const existingUsers = await orm.list(User, {
    include: usernameLookupSource,
    lastSeen: { id: session.user.id },
    limit: 1,
    offset: username as unknown as number,
  });

  return { available: !existingUsers.length };
};
