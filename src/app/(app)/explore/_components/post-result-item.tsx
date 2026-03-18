"use client";

import { memo } from "react";
import { Post } from "@generated/client";
import { RiUserLine } from "@remixicon/react";

export const PostResultItem = memo(function PostResultItem({ post }: { post: Post }) {
  return (
    <div className="cursor-pointer rounded-lg border border-stone-200 p-4 hover:bg-stone-50">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center">
          <RiUserLine size={16} className="text-gray-500" />
        </div>
        <span className="text-sm text-gray-600 tabular-nums">User {post.userId}</span>
      </div>
      <p className="text-pretty text-gray-800">{post.text_content}</p>
      <p className="mt-2 text-xs text-gray-400 tabular-nums" suppressHydrationWarning>
        {new Date(post.created_at).toLocaleDateString()}
      </p>
    </div>
  );
});
