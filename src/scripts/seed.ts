import { User, Post } from "../../.generated/client";

const fakeUsers = [
  {
    name: "Alice Johnson",
    email: "alice@example.com",
    username: "alice_j",
  },
  {
    name: "Bob Smith",
    email: "bob@example.com",
    username: "bobsmith",
  },
  {
    name: "Carol White",
    email: "carol@example.com",
    username: "carol_white",
  },
  {
    name: "David Brown",
    email: "david@example.com",
    username: "david_brown",
  },
  {
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

async function seedUsers(): Promise<string[]> {
  const userIds: string[] = [];
  const now = new Date();

  for (const userData of fakeUsers) {
    const id = crypto.randomUUID();
    userIds.push(id);

    const result = await User.SAVE({
      id,
      name: userData.name,
      email: userData.email,
      email_verified: true,
      image: null,
      username: userData.username,
      created_at: now,
      updated_at: now,
    });

    if (result.ok) {
      console.log(`✅ Created user: ${userData.username}`);
    } else {
      console.error(
        `❌ Failed to create user ${userData.username}:`,
        result.message,
      );
    }
  }

  return userIds;
}

async function seedPosts(userIds: string[]): Promise<void> {
  const now = new Date();

  for (let i = 0; i < fakePosts.length; i++) {
    const userId = userIds[i % userIds.length];
    const postContent = fakePosts[i];
    const id = crypto.randomUUID();

    const result = await Post.SAVE({
      id,
      userId,
      text_content: postContent,
      created_at: new Date(now.getTime() - i * 3600000),
      updated_at: new Date(now.getTime() - i * 3600000),
    });

    if (result.ok) {
      console.log(
        `✅ Created post ${i + 1}: ${postContent.substring(0, 40)}...`,
      );
    } else {
      console.error(`❌ Failed to create post ${i + 1}:`, result.message);
    }
  }
}

async function main() {
  console.log("🌱 Starting seed process...\n");

  try {
    const userIds = await seedUsers();
    console.log("");

    await seedPosts(userIds);
    console.log("");

    console.log("✨ Seed completed successfully!");
    console.log(`   Created ${fakeUsers.length} users`);
    console.log(`   Created ${fakePosts.length} posts`);
  } catch (error) {
    console.error("💥 Seed failed:", error);
    process.exit(1);
  }
}

main();
