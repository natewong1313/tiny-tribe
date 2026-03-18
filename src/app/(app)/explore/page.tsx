import { Suspense } from "react";
import type { Metadata } from "vinext/shims/metadata";
import { ExplorePageClient } from "./_components/explore-page-client";

export const metadata: Metadata = {
  title: "Explore | Tiny Tribe",
  description: "Search for users and posts",
};

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tt-green-600" />
        </div>
      }
    >
      <ExplorePageClient />
    </Suspense>
  );
}
