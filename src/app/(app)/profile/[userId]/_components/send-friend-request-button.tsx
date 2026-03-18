"use client";

import { useState, useTransition } from "react";
import { UserAppService } from "@generated/client";
import { useRouter } from "vinext/shims/navigation";

export default function SendFriendRequestButton({ targetUserId }: { targetUserId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSendRequest = () => {
    setError(null);

    startTransition(async () => {
      try {
        const result = await UserAppService.sendFriendRequest(targetUserId, fetch);
        if (!result.ok) {
          setError(result.message || "Could not send friend request");
          return;
        }

        router.refresh();
      } catch {
        setError("Could not send friend request");
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSendRequest}
        disabled={isPending}
        className="rounded-full bg-tt-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-tt-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Sending..." : "Add friend"}
      </button>

      {error ? (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
