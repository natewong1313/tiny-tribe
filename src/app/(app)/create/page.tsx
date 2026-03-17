"use client";

import { useState, useRef, useCallback, useId } from "react";
import { Button } from "@/components/button";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "vinext/shims/navigation";
import { Post, PostMedia } from "@generated/client";
import { RiCameraLine, RiImageLine, RiVideoLine } from "@remixicon/react";

interface MediaItem {
  id: string;
  file: File;
  previewUrl: string;
  type: "image" | "video";
}

const createPostSchema = z.object({
  text_content: z.string().min(1, "Post content is required"),
});

export default function CreatePage() {
  const formId = useId();
  const { data: session } = useSession();
  const router = useRouter();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    photoInputRef.current?.click();
  };

  const handleVideoClick = () => {
    videoInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleMediaSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [],
  );

  const removeMedia = useCallback((id: string) => {
    setMediaItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const form = useForm({
    defaultValues: {
      text_content: "",
    },
    validators: {
      onSubmit: createPostSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      console.log("Session:", session);
      console.log("Session user ID:", session?.user?.id);
      
      if (!session?.user?.id) {
        formApi.fieldInfo.text_content.instance?.setErrorMap({
          onSubmit: "You must be logged in to create a post",
        });
        return;
      }

      const now = new Date().toISOString();

      const postData = {
        text_content: value.text_content,
        userId: session.user.id,
        created_at: now,
        updated_at: now,
      };
      console.log("Sending Post data:", postData);

      try {
        // 1. Save the Post first (no id - let DB generate it)
        const postResult = await Post.SAVE(postData);
        console.log("Post result:", postResult);

        if (!postResult.ok || !postResult.data) {
          formApi.fieldInfo.text_content.instance?.setErrorMap({
            onSubmit: postResult.message || "Failed to create post",
          });
          return;
        }

        const postId = postResult.data.id;
        console.log("Created post with ID:", postId);

        // 2. Save each PostMedia (no id - let DB generate it)
        for (const _mediaItem of mediaItems) {
          const mediaData = {
            postId: postId,
            created_at: now,
            updated_at: now,
          };
          console.log("Sending PostMedia data:", mediaData);
          
          const mediaResult = await PostMedia.SAVE(mediaData);
          console.log("PostMedia result:", mediaResult);

          if (!mediaResult.ok) {
            console.error("Failed to save media:", mediaResult.message);
          }
        }

        // 3. Redirect to home after success
        router.push("/home");
        router.refresh();
      } catch {
        formApi.fieldInfo.text_content.instance?.setErrorMap({
          onSubmit: "An unexpected error occurred while creating the post",
        });
      }
    },
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-stone-300 border-b border-stone-400/50 p-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Create Post</h1>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              form={formId}
              className="w-fit py-1 px-3"
              disabled={!canSubmit || isSubmitting}
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
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
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full min-h-[200px] p-4 text-sm placeholder-gray-400 border-0 focus:ring-0 focus:outline-none resize-none"
                rows={6}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="mt-1 text-sm text-red-600">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {mediaItems.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {mediaItems.map((item) => (
              <div key={item.id} className="relative aspect-square">
                {item.type === "video" ? (
                  <video
                    src={item.previewUrl}
                    className="w-full h-full object-cover rounded-lg"
                    controls
                  >
                    <track kind="captions" src="" label="No captions" />
                  </video>
                ) : (
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
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
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
