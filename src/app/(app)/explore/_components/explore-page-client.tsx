"use client";

import { useQueryState } from "nuqs";
import useSWR from "swr";
import { Input } from "@/components/input";
import {
  Post,
  PostAppService,
  SearchUserWithPhotoResponse,
  UserAppService,
} from "@generated/client";
import { RiSearchLine } from "@remixicon/react";
import ShapeSvg from "@/assets/shape1.svg?react";
import { UserResultItem } from "./user-result-item";
import { PostResultItem } from "./post-result-item";

// SWR fetcher for parallel search
async function searchFetcher(
  query: string,
): Promise<{ users: SearchUserWithPhotoResponse[]; posts: Post[] }> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { users: [], posts: [] };
  }

  const [usersResult, postsResult] = await Promise.all([
    UserAppService.searchUsersWithPhoto(trimmedQuery, 25, fetch),
    PostAppService.searchPostsByText(trimmedQuery, 25, fetch),
  ]);

  if (!usersResult.ok || !postsResult.ok) {
    const firstErrorMessage =
      usersResult.message || postsResult.message || "Failed to load search results";
    throw new Error(firstErrorMessage);
  }

  return {
    users: usersResult.data ?? [],
    posts: postsResult.data ?? [],
  };
}

export function ExplorePageClient() {
  const [searchQuery, setSearchQuery] = useQueryState("q", {
    defaultValue: "",
    parse: (value) => value,
    serialize: (value) => value,
  });

  // Use SWR for automatic deduplication and caching
  const { data, error, isLoading } = useSWR(
    searchQuery.trim() ? `search-${searchQuery.trim()}` : null,
    () => searchFetcher(searchQuery),
    {
      dedupingInterval: 300, // Debounce by 300ms
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const hasSearchQuery = searchQuery.trim().length > 0;
  const hasResults = (data?.users.length ?? 0) > 0 || (data?.posts.length ?? 0) > 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="px-6 w-full py-6 border-b border-stone-200">
        <Input
          name="search"
          value={searchQuery}
          placeholder="Search users or posts..."
          icon={<RiSearchLine size={20} />}
          onChange={(e) => setSearchQuery(e.target.value)}
          onBlur={() => {}}
          className="w-full"
        />
      </div>

      <div className="flex-1 px-6 py-4">
        {!hasSearchQuery ? (
          <div className="text-tt-green-600 flex flex-col justify-center items-center mt-36">
            <ShapeSvg className="w-24 h-24 text-tt-green-500 [&>*]:!fill-current" />
            <p className="mt-3 text-pretty text-lg">Search for users or posts</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <p className="text-pretty text-gray-500">Searching...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-pretty text-red-600">{error.message}</p>
          </div>
        ) : !hasResults ? (
          <div className="text-center py-8">
            <p className="text-pretty text-gray-500">
              No results found for &quot;{searchQuery.trim()}&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {data?.users.length ? (
              <section>
                <h2 className="mb-4 text-balance text-lg font-semibold text-gray-800">Users</h2>
                <div className="space-y-3">
                  {data.users.map((user) => (
                    <UserResultItem key={user.user.id} user={user} />
                  ))}
                </div>
              </section>
            ) : null}

            {data?.posts.length ? (
              <section>
                <h2 className="mb-4 text-balance text-lg font-semibold text-gray-800">Posts</h2>
                <div className="space-y-3">
                  {data.posts.map((post) => (
                    <PostResultItem key={post.id} post={post} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
