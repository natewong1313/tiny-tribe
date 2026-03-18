"use client";

import { memo } from "react";
import { SearchUserWithPhotoResponse } from "@generated/client";
import { RiUserLine } from "@remixicon/react";

export const UserResultItem = memo(function UserResultItem({
  user,
}: {
  user: SearchUserWithPhotoResponse;
}) {
  return (
    <div className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 p-3 hover:bg-stone-50">
      <div className="w-12 h-12 rounded-full bg-stone-300 flex items-center justify-center">
        {user.photoDataUrl ? (
          <img
            src={user.photoDataUrl}
            alt={user.user.name || user.user.email}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <RiUserLine size={24} className="text-gray-500" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-pretty font-medium text-gray-900">{user.user.name || user.user.email}</p>
        <p className="text-pretty text-sm text-gray-500">
          {user.user.username ? `@${user.user.username}` : user.user.email}
        </p>
      </div>
    </div>
  );
});
