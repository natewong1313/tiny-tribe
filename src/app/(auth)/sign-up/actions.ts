"use server";

import { User } from "@/data/models.cloesce";
import { env } from "cloudflare:workers";
import { getCloesceOrm } from "@/lib/cloesce-runtime";

interface CreateUserInput {
  email: string;
  id: string;
}

interface CreateUserResult {
  error?: string;
  ok: boolean;
}

const createUserProfile = async (
  input: CreateUserInput,
): Promise<CreateUserResult> => {
  if (!input.id || !input.email) {
    return {
      error: "id and email are required",
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
        image: null,
        name: "",
        updated_at: now,
        username: "",
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

interface CheckUsernameResult {
  available: boolean;
  error?: string;
  ok: boolean;
}

const checkUsernameAvailability = async (
  username: string,
): Promise<CheckUsernameResult> => {
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
    const exists = users.some(
      (user) => user.username?.toLowerCase() === normalized && user.username,
    );

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

export { checkUsernameAvailability, createUserProfile };
