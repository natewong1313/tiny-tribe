"use server";

import { env } from "cloudflare:workers";
import { User } from "@/data/models.cloesce";
import { getCloesceOrm } from "@/lib/cloesce-runtime";

interface CreateUserInput {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  username: string;
}

export const createUserProfile = async (input: CreateUserInput): Promise<{
  error?: string;
  ok: boolean;
}> => {
  if (!input.id || !input.name || !input.email || !input.username) {
    return {
      error: "id, name, email, and username are required",
      ok: false,
    };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(input.username)) {
    return {
      error: "Invalid username format",
      ok: false,
    };
  }

  try {
    const orm = await getCloesceOrm(env);
    const now = new Date();

    const created = await orm.upsert(
      User,
      {
        created_at: now,
        email: input.email,
        email_verified: false,
        id: input.id,
        image: input.image ?? null,
        name: input.name,
        updated_at: now,
        username: input.username,
      },
      {},
    );

    if (!created) {
      return { error: "Failed to create user profile", ok: false };
    }

    return { ok: true };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Failed to create user profile", ok: false };
  }
};

export const checkUsernameAvailability = async (username: string): Promise<{
  available: boolean;
  error?: string;
  ok: boolean;
}> => {
  if (!username) {
    return { available: false, error: "Username is required", ok: false };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { available: false, error: "Invalid username format", ok: false };
  }

  try {
    const orm = await getCloesceOrm(env);
    const normalized = username.toLowerCase();
    const users = await orm.list(User, { include: {} });
    const exists = users.some((user) => user.username.toLowerCase() === normalized);

    return {
      available: !exists,
      ok: true,
    };
  } catch (error) {
    console.error("Error checking username:", error);
    return {
      available: false,
      error: "Failed to check username availability",
      ok: false,
    };
  }
};
