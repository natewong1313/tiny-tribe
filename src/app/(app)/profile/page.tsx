import { PostAppService, UserAppService } from "@generated/client";
import { fetchWithSession } from "@/lib/fetch";
import { RiUserLine } from "@remixicon/react";
import EditProfileForm from "./_components/edit-profile-form";

export default async function ProfilePage() {
  const [profileResult, postsResult] = await Promise.all([
    UserAppService.getProfileWithPhoto(fetchWithSession),
    PostAppService.listMyPosts(50, fetchWithSession),
  ]);

  if (!profileResult.ok) {
    throw new Error(`Failed to load profile: ${profileResult.status}`);
  }

  if (!postsResult.ok) {
    throw new Error(`Failed to load posts: ${postsResult.status}`);
  }

  const { user, photoDataUrl } = profileResult.data!;
  const posts = postsResult.data ?? [];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6 sm:px-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          {photoDataUrl ? (
            <img
              src={photoDataUrl}
              alt={user.name || "Profile"}
              className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-200 sm:h-24 sm:w-24">
              <RiUserLine size={40} className="text-stone-500" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold text-stone-900">
              {user.name || user.email}
            </h1>
            <p className="mt-1 truncate text-sm text-stone-600">
              {user.username ? `@${user.username}` : user.email}
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-stone-200 pt-4">
          <EditProfileForm
            userId={user.id}
            initialName={user.name || ""}
            initialUsername={user.username || ""}
            initialPhotoDataUrl={photoDataUrl}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900">Posts</h2>

        {posts.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">You have not posted yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {posts.map((post) => (
              <article key={post.id} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <p className="whitespace-pre-wrap text-sm text-stone-800">{post.text_content}</p>
                <p className="mt-2 text-xs text-stone-500" suppressHydrationWarning>
                  {new Date(post.created_at).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
