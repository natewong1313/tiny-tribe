#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Post, User } from "../../.generated/client";

const execFileAsync = promisify(execFile);

const seedFetch: typeof fetch = (input, init) => {
  const method = init?.method;

  return fetch(input, {
    ...init,
    method: typeof method === "string" ? method.toUpperCase() : method,
  });
};

interface D1ExecuteItem {
  results?: { [key: string]: unknown }[];
  success?: boolean;
}

const fakeUsers = [
  {
    id: "seed-user-alice-0001",
    name: "Alice Johnson",
    email: "alice@example.com",
    username: "alice_j",
  },
  {
    id: "seed-user-bob-0002",
    name: "Bob Smith",
    email: "bob@example.com",
    username: "bobsmith",
  },
  {
    id: "seed-user-carol-0003",
    name: "Carol White",
    email: "carol@example.com",
    username: "carol_white",
  },
  {
    id: "seed-user-david-0004",
    name: "David Brown",
    email: "david@example.com",
    username: "david_brown",
  },
  {
    id: "seed-user-emma-0005",
    name: "Emma Davis",
    email: "emma@example.com",
    username: "emma_d",
  },
];

const fakePosts = [
  "Just finished a great workout! Feeling energized 💪",
  "Beautiful day for a hike in the mountains 🏔",
  "Working on a new project. Excited to share soon!",
  "Coffee and coding - the perfect Sunday morning ☕",
  "Finally mastered that recipe I've been working on! 🍳",
  "Great meeting with the team today. Lots of progress!",
  "Weekend vibes: relaxing with a good book 📚",
  "Just got back from an amazing trip! Photos coming soon.",
  "New blog post is up! Link in bio 📝",
  "Practicing guitar. Slowly getting better 🎸",
  "Sunday meal prep complete! 🥗",
  "Excited about the new features we're building!",
  "Nothing beats home cooking 🏠🍽",
  "Late night coding session... time for bed 😴",
  "Grateful for this community! 🙏",
];

/**
 * Validates and sanitizes an email address for safe SQL usage
 * Only allows standard email characters
 */
function validateEmail(email: string): string | null {
  // Email regex pattern (basic validation)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return null;
  }

  return email;
}

/**
 * Validates UUID format
 */
function validateUUID(id: string): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    return null;
  }

  return id;
}

/**
 * Escapes SQL string literals by replacing single quotes with two single quotes
 * This prevents SQL injection for string values
 */
function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

async function runLocalD1Json(sql: string): Promise<D1ExecuteItem[]> {
  const { stdout } = await execFileAsync("bunx", [
    "wrangler",
    "d1",
    "execute",
    "tiny-tribe-db",
    "--local",
    "--command",
    sql,
    "--json",
  ]);

  return JSON.parse(stdout) as D1ExecuteItem[];
}

async function lookupUserIdByEmail(email: string): Promise<string | null> {
  const validatedEmail = validateEmail(email);
  if (!validatedEmail) {
    console.error(`❌ Invalid email format: ${email}`);
    return null;
  }

  const escapedEmail = escapeSqlString(validatedEmail);
  const rows = await runLocalD1Json(
    `SELECT id FROM "User" WHERE email = '${escapedEmail}' LIMIT 1;`,
  );
  const first = rows[0]?.results?.[0];

  if (!first || typeof first.id !== "string") {
    return null;
  }

  return first.id;
}

async function seedUsers(): Promise<string[]> {
  const userIds: string[] = [];
  const now = new Date();

  for (const userData of fakeUsers) {
    const result = await User.SAVE(
      {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        email_verified: true,
        image: null,
        username: userData.username,
        created_at: now,
        updated_at: now,
      },
      "default",
      seedFetch,
    );

    if (result.ok) {
      userIds.push(userData.id);
      console.log(`✅ Created user: ${userData.username}`);
    } else {
      const existingId = await lookupUserIdByEmail(userData.email);
      if (existingId) {
        userIds.push(existingId);
        console.log(`ℹ️ Using existing user for ${userData.username}: ${existingId}`);
      } else {
        console.error(`❌ Failed to create user ${userData.username}:`, result.message);
      }
    }
  }

  return userIds;
}

async function seedPosts(userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    console.log("⚠️ No users available for post seeding");
    return;
  }

  const now = new Date();

  for (let i = 0; i < fakePosts.length; i++) {
    const userId = userIds[i % userIds.length];
    const postContent = fakePosts[i];
    const id = crypto.randomUUID();

    const result = await Post.SAVE(
      {
        id,
        userId,
        text_content: postContent,
        created_at: new Date(now.getTime() - i * 3600000),
        updated_at: new Date(now.getTime() - i * 3600000),
      },
      "default",
      seedFetch,
    );

    if (result.ok) {
      console.log(`✅ Created post ${i + 1}: ${postContent.substring(0, 40)}...`);
    } else {
      console.error(`❌ Failed to create post ${i + 1}:`, result.message);
    }
  }
}

async function seedFriendships(userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    console.log("⚠️ No users available for friendship seeding");
    return;
  }

  const targetEmail = process.env.SEED_FRIEND_EMAIL ?? "test@gmail.com";
  const validatedEmail = validateEmail(targetEmail);
  if (!validatedEmail) {
    console.error(`❌ Invalid SEED_FRIEND_EMAIL: ${targetEmail}`);
    return;
  }

  const targetUserId = await lookupUserIdByEmail(validatedEmail);

  if (!targetUserId) {
    console.log(`⚠️ Skipping friendship seed: no User row for ${validatedEmail}`);
    return;
  }

  const seededFriendId = userIds[0];
  if (!seededFriendId || seededFriendId === targetUserId) {
    console.log("⚠️ Skipping friendship seed: invalid friendship pair");
    return;
  }

  // Validate UUIDs before using in SQL
  const validatedFriendshipId = validateUUID(crypto.randomUUID());
  const validatedTargetId = validateUUID(targetUserId);
  const validatedSeededId = validateUUID(seededFriendId);

  if (!validatedFriendshipId || !validatedTargetId || !validatedSeededId) {
    console.error("❌ Invalid UUID format detected");
    return;
  }

  const nowIso = new Date().toISOString();

  await runLocalD1Json(`
    INSERT INTO "Friendship" (
      "id",
      "requesterId",
      "addresseeId",
      "status",
      "responded_at",
      "created_at",
      "updated_at"
    )
    SELECT
      '${escapeSqlString(validatedFriendshipId)}',
      '${escapeSqlString(validatedTargetId)}',
      '${escapeSqlString(validatedSeededId)}',
      'accepted',
      '${escapeSqlString(nowIso)}',
      '${escapeSqlString(nowIso)}',
      '${escapeSqlString(nowIso)}'
    WHERE NOT EXISTS (
      SELECT 1
      FROM "Friendship"
      WHERE (
        "requesterId" = '${escapeSqlString(validatedTargetId)}'
        AND "addresseeId" = '${escapeSqlString(validatedSeededId)}'
      ) OR (
        "requesterId" = '${escapeSqlString(validatedSeededId)}'
        AND "addresseeId" = '${escapeSqlString(validatedTargetId)}'
      )
    );
  `);

  console.log(
    `✅ Ensured accepted friendship between ${validatedEmail} and seeded user ${seededFriendId}`,
  );
}

async function main() {
  console.log("🌱 Starting seed process...\n");

  try {
    const userIds = await seedUsers();
    console.log("");

    await seedPosts(userIds);
    console.log("");

    await seedFriendships(userIds);
    console.log("");

    console.log("✨ Seed completed successfully!");
    console.log(`   Seed users available: ${userIds.length}`);
    console.log(`   Created ${fakePosts.length} posts`);
  } catch (error) {
    console.error("💥 Seed failed:", error);
    process.exit(1);
  }
}

main();
