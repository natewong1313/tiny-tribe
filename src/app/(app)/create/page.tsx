"use client";

import { useState, useRef, useCallback, useId, useEffect, memo } from "react";
import { Button } from "@/components/button";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useSession } from "@/lib/auth-client";
import { PostAppService } from "@generated/client";
import { RiCameraLine, RiImageLine, RiVideoLine, RiCloseLine } from "@remixicon/react";

interface MediaItem {
  id: string;
  file: File;
  previewUrl: string;
  type: "image" | "video";
}

interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

const createPostSchema = z.object({
  text_content: z.string().min(1, "Post content is required"),
});

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches ? [...new Set(matches)] : [];
}

async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    const urlObj = new URL(url);
    return {
      url,
      title: urlObj.hostname,
      description: url,
    };
  } catch {
    return null;
  }
}

interface SubmitButtonProps {
  formId: string;
  canSubmit: boolean;
  isSubmitting: boolean;
}

const SubmitButton = memo(function SubmitButton({
  formId,
  canSubmit,
  isSubmitting,
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      form={formId}
      className="w-fit py-1 px-3"
      disabled={!canSubmit || isSubmitting}
      isLoading={isSubmitting}
    >
      {isSubmitting ? "Posting..." : "Post"}
    </Button>
  );
});

export default function CreatePage() {
  const formId = useId();
  useSession();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [linkPreviews, setLinkPreviews] = useState<LinkPreview[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => photoInputRef.current?.click();
  const handleVideoClick = () => videoInputRef.current?.click();
  const handleCameraClick = () => cameraInputRef.current?.click();

  const handleMediaSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newItems: MediaItem[] = Array.from(files).map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
      }));
      setMediaItems((prev) => [...prev, ...newItems]);
    }
    event.target.value = "";
  }, []);

  const removeMedia = useCallback((id: string) => {
    setMediaItems((prev) => {
      let revokedUrl: string | null = null;
      const filtered = prev.filter((i) => {
        if (i.id === id) {
          revokedUrl = i.previewUrl;
          return false;
        }
        return true;
      });
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
      return filtered;
    });
  }, []);

  const clearAllMedia = useCallback(() => {
    setMediaItems((prev) => {
      prev.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
      return [];
    });
  }, []);

  const handleTextChange = useCallback(
    async (value: string, fieldHandler: (value: string) => void) => {
      fieldHandler(value);

      const urls = extractUrls(value);
      if (urls.length === 0) {
        setLinkPreviews([]);
        return;
      }

      const previews = await Promise.all(urls.map(fetchLinkPreview));
      setLinkPreviews(previews.filter((preview): preview is LinkPreview => preview !== null));
    },
    [],
  );

  const form = useForm({
    defaultValues: {
      text_content: "",
    },
    validators: {
      onSubmit: createPostSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const result = await PostAppService.createPost(value.text_content, mediaItems.length);

        if (!result.ok) {
          formApi.fieldInfo.text_content.instance?.setErrorMap({
            onSubmit: result.message || "Failed to create post",
          });
          return;
        }

        setShowSuccessBanner(true);
        formApi.reset();
        clearAllMedia();
        setLinkPreviews([]);
        setTimeout(() => {
          setShowSuccessBanner(false);
        }, 3000);
      } catch {
        formApi.fieldInfo.text_content.instance?.setErrorMap({
          onSubmit: "An unexpected error occurred while creating the post",
        });
      }
    },
  });

  useEffect(() => {
    return () => {
      mediaItems.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [mediaItems]);

  return (
    <div className="min-h-screen">
      {showSuccessBanner && (
        <div className="bg-green-500 text-white px-4 py-3 flex items-center justify-between animate-in slide-in-from-top">
          <span className="font-medium">Post created successfully!</span>
          <button
            onClick={() => setShowSuccessBanner(false)}
            className="text-white hover:text-green-100"
            type="button"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="bg-stone-300 border-b border-stone-400/50 p-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Create Post</h1>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <SubmitButton formId={formId} canSubmit={canSubmit} isSubmitting={isSubmitting} />
          )}
        </form.Subscribe>
      </div>

      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="p-4"
      >
        <form.Field name="text_content">
          {(field) => (
            <div>
              <textarea
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => handleTextChange(e.target.value, field.handleChange)}
                placeholder="What's on your mind?"
                className="w-full min-h-[200px] p-4 text-sm placeholder-gray-400 border-0 focus:ring-0 focus:outline-none resize-none"
                rows={6}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="mt-1 text-sm text-red-600">{field.state.meta.errors.join(", ")}</p>
              )}
            </div>
          )}
        </form.Field>

        {linkPreviews.length > 0 && (
          <div className="mt-4 space-y-2">
            {linkPreviews.map((preview) => (
              <a
                key={preview.url}
                href={preview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{preview.title}</p>
                    <p className="text-xs text-gray-500 truncate mt-1">{preview.description}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{preview.url}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {mediaItems.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {mediaItems.map((item) => (
              <div key={item.id} className="relative aspect-square">
                {item.type === "video" ? (
                  <video
                    src={item.previewUrl}
                    className="w-full h-full object-cover rounded-lg"
                    controls
                  >
                    <track kind="captions" src="" label="No captions available" />
                  </video>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(item.id)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-6 pt-4 border-t border-stone-300">
          <div className="flex gap-2">
            <button
              onClick={handlePhotoClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              type="button"
            >
              <RiImageLine className="w-5 h-5" />
              <span className="text-sm">Photo</span>
            </button>
            <button
              onClick={handleVideoClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              type="button"
            >
              <RiVideoLine className="w-5 h-5" />
              <span className="text-sm">Video</span>
            </button>
            <button
              onClick={handleCameraClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              type="button"
            >
              <RiCameraLine className="w-5 h-5" />
              <span className="text-sm">Camera</span>
            </button>
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleMediaSelect}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleMediaSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleMediaSelect}
            className="hidden"
          />
        </div>
      </form>
    </div>
  );
}
