import { UserAppService } from "@generated/client";
import { fetchWithSession } from "@/lib/fetch";
import { RiUserLine } from "@remixicon/react";

export default async function ProfilePage() {
  const result = await UserAppService.getProfileWithPhoto(fetchWithSession);

  if (!result.ok) {
    throw new Error(`Failed to load profile: ${result.status}`);
  }

  const { user, photoDataUrl } = result.data!;

  return (
    <div className="p-6">
      <div className="flex flex-col items-center">
        {photoDataUrl ? (
          <img
            src={photoDataUrl}
            alt={user.name || "Profile"}
            className="w-32 h-32 rounded-full object-cover border-4 border-tt-green-500"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-stone-300 flex items-center justify-center border-4 border-tt-green-500">
            <RiUserLine size={48} className="text-gray-500" />
          </div>
        )}
        <h1 className="mt-4 text-2xl font-bold text-gray-800">
          {user.name || user.email}
        </h1>
        <p className="text-gray-600">{user.email}</p>
      </div>
    </div>
  );
}
