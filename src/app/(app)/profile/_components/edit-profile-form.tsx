"use client";

import { useEffect, useId, useState } from "react";
import { RiImageAddLine } from "@remixicon/react";
import { UserAppService } from "@generated/client";
import { useRouter } from "vinext/shims/navigation";

interface EditProfileFormProps {
  initialName: string;
  initialUsername: string;
  initialPhotoDataUrl: string | null;
}

export default function EditProfileForm({
  initialName,
  initialUsername,
  initialPhotoDataUrl,
}: EditProfileFormProps) {
  const router = useRouter();
  const nameId = useId();
  const usernameId = useId();
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

    setSelectedPhoto(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setName(initialName);
    setUsername(initialUsername);
    setSelectedPhoto(null);
    setPhotoPreviewUrl(null);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSaving(true);
    setError(null);

    try {
      const photoBytes = selectedPhoto
        ? new Uint8Array(await selectedPhoto.arrayBuffer())
        : new Uint8Array();

      const result = await UserAppService.updateProfile(name, username, photoBytes, fetch);

      if (!result.ok) {
        setError(result.message || "Failed to update profile");
        return;
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
          // eslint-disable-next-line @next/next/no-img-element
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
        <label htmlFor={nameId} className="text-sm font-medium text-stone-700">
          Name
        </label>
        <input
          id={nameId}
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-tt-green-500"
          placeholder="Your name"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor={usernameId} className="text-sm font-medium text-stone-700">
          Username
        </label>
        <input
          id={usernameId}
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
