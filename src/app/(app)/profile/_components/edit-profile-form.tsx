"use client";

import { useEffect, useState } from "react";
import { RiImageAddLine } from "@remixicon/react";
import { User, UserAppService } from "@generated/client";
import { useRouter } from "vinext/shims/navigation";
import { validateUsername } from "@/lib/username";

type EditProfileFormProps = {
  userId: string;
  initialName: string;
  initialUsername: string;
  initialPhotoDataUrl: string | null;
};

export default function EditProfileForm({
  userId,
  initialName,
  initialUsername,
  initialPhotoDataUrl,
}: EditProfileFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const previewImage = photoPreviewUrl || initialPhotoDataUrl;

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setSelectedPhoto(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setName(initialName);
    setUsername(initialUsername);
    setSelectedPhoto(null);
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoPreviewUrl(null);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    if (!trimmedName) {
      setError("Name is required");
      return;
    }

    const usernameValidation = validateUsername(trimmedUsername);
    if (!usernameValidation.valid) {
      setError(usernameValidation.error || "Invalid username");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (trimmedUsername !== initialUsername) {
        const availabilityResult = await UserAppService.isUsernameAvailable(trimmedUsername, fetch);
        if (!availabilityResult.ok) {
          setError(availabilityResult.message || "Failed to validate username");
          return;
        }

        if (!availabilityResult.data) {
          setError("Username is already taken");
          return;
        }
      }

      const saveResult = await User.SAVE({
        id: userId,
        name: trimmedName,
        username: trimmedUsername,
        updated_at: new Date(),
      });

      if (!saveResult.ok) {
        setError(saveResult.message || "Failed to save profile");
        return;
      }

      if (selectedPhoto) {
        const user = new User();
        user.id = userId;
        const photoBytes = new Uint8Array(await selectedPhoto.arrayBuffer());
        const uploadResult = await user.uploadPhoto(photoBytes, fetch);
        if (!uploadResult.ok) {
          setError(uploadResult.message || "Failed to upload profile photo");
          return;
        }
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setError("Could not update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          resetForm();
          setIsOpen(true);
        }}
        className="rounded-full bg-tt-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-tt-green-700"
      >
        Edit profile
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        {previewImage ? (
          <img
            src={previewImage}
            alt="Profile preview"
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-200 text-stone-500">
            <RiImageAddLine size={20} />
          </div>
        )}

        <label className="inline-flex cursor-pointer items-center rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-50">
          Change photo
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handlePhotoChange}
            className="sr-only"
          />
        </label>
      </div>

      <div className="space-y-1">
        <label htmlFor="profile-name" className="text-sm font-medium text-stone-700">
          Name
        </label>
        <input
          id="profile-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-tt-green-500"
          placeholder="Your name"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="profile-username" className="text-sm font-medium text-stone-700">
          Username
        </label>
        <input
          id="profile-username"
          name="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-tt-green-500"
          placeholder="username"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-tt-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-tt-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => {
            resetForm();
            setIsOpen(false);
          }}
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
