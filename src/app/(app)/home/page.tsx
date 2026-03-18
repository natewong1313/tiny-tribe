import { Suspense } from "react";
import { Post, PostAppService } from "@generated/client";
import { fetchWithSession } from "@/lib/fetch";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <div className="px-6 py-6 divide-y divide-stone-400/60">
        <Suspense fallback={<div className="py-6 text-sm text-stone-500">Loading feed...</div>}>
          <FeedPosts />
        </Suspense>
      </div>
    </div>
  );
}

async function FeedPosts() {
  const feedResult = await PostAppService.listFollowerPosts(50, fetchWithSession);

  if (!feedResult.ok) {
    throw new Error(feedResult.message || `Failed to load feed: ${feedResult.status}`);
  }

  const posts: Post[] = feedResult.data ?? [];

  return posts.length === 0 ? (
    <p className="py-6 text-sm text-stone-500">No posts in your feed yet.</p>
  ) : (
    posts.map((post) => <PostItem key={post.id} post={post} />)
  );
}

const PostItem = ({ post }: { post: Post }) => {
  return (
    <div className="py-6">
      <div className="flex items-center">
        <div className="h-12 w-12 rounded-full mr-2 bg-stone-200" />
        <div>
          <h1 className="font-semibold -mb-1">User {post.userId}</h1>
          <p className="text-sm text-stone-500">@{post.userId}</p>
        </div>
        <span className="text-stone-500 text-sm ml-auto" suppressHydrationWarning>
          {new Date(post.created_at).toLocaleString()}
        </span>
      </div>
      <div className="mt-2 space-y-3 p-2">
        <p className="whitespace-pre-wrap">{post.text_content}</p>
      </div>
    </div>
  );
};
