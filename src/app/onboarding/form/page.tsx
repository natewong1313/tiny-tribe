"use client";

import { Button } from "@/components/button";
import { z } from "zod";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import { useForm } from "@tanstack/react-form";
import { Input } from "@/components/input";
import { useId, useRef, useState } from "react";
import "./filepond-custom.css";
import { useSession } from "@/lib/auth-client";
import { User } from "@generated/client";
import { useRouter } from "vinext/shims/navigation";
import { isUsernameAvailable } from "@/actions/username";

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

const onboardingSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  username: z
    .string()
    .min(1, "Username is required")
    .refine((value) => !value.endsWith("_"), {
      message: "Username cannot end with underscore",
    }),
  photo: z.string().min(1, "Profile photo is required"),
});

const FormPage = () => {
  const router = useRouter();
  const photoLabelId = useId();
  const { data: session } = useSession();
  const [files, setFiles] = useState<File[]>([]);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailabilityError, setUsernameAvailabilityError] = useState<
    string | null
  >(null);
  const [isUsernameAvailableNow, setIsUsernameAvailableNow] = useState(false);
  const usernameCheckIdRef = useRef(0);

  const checkUsernameAvailability = async (username: string) => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setUsernameAvailabilityError(null);
      setIsUsernameAvailableNow(false);
      return { available: false, error: "Username is required" };
    }

    const checkId = ++usernameCheckIdRef.current;
    setIsCheckingUsername(true);

    try {
      const result = await isUsernameAvailable(trimmedUsername);
      if (checkId !== usernameCheckIdRef.current) {
        return { available: false, error: "Stale username check" };
      }

      if (!result.available) {
        const error = result.error ?? "Username is already taken";
        setUsernameAvailabilityError(error);
        setIsUsernameAvailableNow(false);
        return { available: false, error };
      }

      setUsernameAvailabilityError(null);
      setIsUsernameAvailableNow(true);
      return { available: true };
    } catch {
      if (checkId !== usernameCheckIdRef.current) {
        return { available: false, error: "Stale username check" };
      }

      const error = "Could not validate username";
      setUsernameAvailabilityError(error);
      setIsUsernameAvailableNow(false);
      return { available: false, error };
    } finally {
      if (checkId === usernameCheckIdRef.current) {
        setIsCheckingUsername(false);
      }
    }
  };

  const form = useForm({
    defaultValues: {
      name: "",
      username: "",
      photo: "",
    },
    validators: {
      onSubmit: onboardingSchema,
    },

    onSubmit: async ({ value, formApi }) => {
      const usernameResult = await checkUsernameAvailability(value.username);
      if (!usernameResult.available) {
        formApi.fieldInfo.username.instance?.setErrorMap({
          onSubmit: usernameResult.error ?? "Username is already taken",
        });
        return;
      }

      const userId = session?.user.id as string;
      const photoFile = files[0];
      if (!photoFile) {
        formApi.fieldInfo.photo.instance?.setErrorMap({
          onSubmit: "Photo is required",
        });
        return;
      }

      const saveResult = await User.SAVE({
        id: userId,
        name: value.name,
        updated_at: new Date(),
        username: value.username,
      });
      if (!saveResult.ok) {
        formApi.fieldInfo.name.instance?.setErrorMap({
          onSubmit: "An unknown error occured",
        });
        return;
      }

      const user = new User();
      user.id = userId;
      const photoBytes = new Uint8Array(await photoFile.arrayBuffer());
      const uploadResult = await user.uploadPhoto(photoBytes);
      if (!uploadResult.ok) {
        formApi.fieldInfo.photo.instance?.setErrorMap({
          onSubmit: uploadResult.message || "An unknown error occured",
        });
        return;
      }
      router.push("/home");
      router.refresh();
    },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6 p-8 flex flex-col min-h-screen"
    >
      <form.Field name="photo">
        {(field) => (
          <div className="space-y-2">
            <span
              id={photoLabelId}
              className="block text-sm font-medium text-gray-700"
            >
              Profile Photo
            </span>
            <div className="w-42.5 h-42.5 mx-auto">
              <FilePond
                className="custom-filepond-bg"
                files={files}
                onupdatefiles={(fileItems) => {
                  const newFiles = fileItems.map(
                    (fileItem) => fileItem.file as File,
                  );
                  setFiles(newFiles);
                  field.handleChange(newFiles[0]?.name ?? "");
                }}
                allowMultiple={false}
                maxFiles={1}
                name="photo"
                labelIdle='Drag & Drop your photo or <span class="filepond--label-action">Browse</span>'
                acceptedFileTypes={["image/png", "image/jpeg", "image/jpg"]}
                imagePreviewHeight={170}
                stylePanelLayout="compact circle"
                styleLoadIndicatorPosition="center bottom"
                styleButtonRemoveItemPosition="center bottom"
              />
            </div>
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-600">
                {(() => {
                  const firstError = field.state.meta.errors.find(Boolean);
                  if (typeof firstError === "string") {
                    return firstError;
                  }
                  return (
                    (firstError as { message?: string } | undefined)?.message ||
                    String(firstError)
                  );
                })()}
              </p>
            )}
          </div>
        )}
      </form.Field>
      <form.Field name="username">
        {(field) => (
          <div>
            <Input
              label="Username"
              name={field.name}
              value={field.state.value}
              onBlur={() => {
                field.handleBlur();
                void checkUsernameAvailability(field.state.value);
              }}
              onChange={(e) => {
                setUsernameAvailabilityError(null);
                setIsUsernameAvailableNow(false);
                field.handleChange(e.target.value);
              }}
              placeholder="kingjames"
              errors={
                usernameAvailabilityError
                  ? [usernameAvailabilityError, ...field.state.meta.errors]
                  : field.state.meta.errors
              }
              helperText={
                isCheckingUsername ? "Checking username availability..." : undefined
              }
            />
            {isUsernameAvailableNow && !isCheckingUsername && !usernameAvailabilityError && (
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-green-600">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.415 0l-3-3a1 1 0 111.414-1.42L8.5 12.09l6.79-6.8a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Username available
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="name">
        {(field) => (
          <Input
            label="Full name"
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            placeholder="LeBron James"
            errors={field.state.meta.errors}
          />
        )}
      </form.Field>
      <div className="mt-auto">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              isLoading={isSubmitting}
              disabled={
                !canSubmit ||
                isSubmitting ||
                isCheckingUsername ||
                Boolean(usernameAvailabilityError)
              }
              type="submit"
            >
              {isSubmitting ? "Saving..." : "Complete Profile"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};
export default FormPage;
