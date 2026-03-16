"use client";

import { Input } from "@/components/input";
import { useSession } from "@/lib/auth-client";
import { User } from "@generated/client";
import { useForm } from "@tanstack/react-form";
import { useId, useState } from "react";
import { useRouter } from "vinext/shims/navigation";
import { z } from "zod";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";

// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

const onboardingSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  username: z.string().min(1, "Username is required"),
  photo: z.string().min(1, "Profile photo is required"),
});

const OnboardingPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [files, setFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const photoLabelId = useId();

  const form = useForm({
    defaultValues: {
      name: "",
      username: "",
      photo: "",
    },
    validators: {
      onSubmit: onboardingSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      try {
        const userId = session?.user?.id;
        const photoFile = files[0];
        if (!userId) {
          setSubmitError("You must be signed in to complete onboarding");
          return;
        }
        if (!photoFile) {
          setSubmitError("Profile photo is required");
          return;
        }

        const saveResult = await User.SAVE({
          id: userId,
          name: value.name,
          updated_at: new Date(),
          username: value.username,
        });
        if (!saveResult.ok) {
          setSubmitError(saveResult.message || "Failed to update profile");
          return;
        }

        const user = new User();
        user.id = userId;
        const photoBytes = new Uint8Array(await photoFile.arrayBuffer());
        const uploadResult = await user.uploadPhoto(photoBytes);
        if (!uploadResult.ok) {
          setSubmitError(
            uploadResult.message || "Failed to upload profile photo",
          );
          return;
        }

        router.push("/home");
        router.refresh();
      } catch {
        setSubmitError("An unexpected error occurred");
      }
    },
  });

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Complete Your Profile</h1>
      <form
        onSubmit={(e) => {
          const nativeEvent = e.nativeEvent as SubmitEvent;
          const submitter = nativeEvent.submitter as HTMLElement | null;
          if (!submitter?.hasAttribute("data-onboarding-submit")) {
            e.preventDefault();
            return;
          }

          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <form.Field name="username">
          {(field) => (
            <Input
              label="Username"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="kingjames"
              errors={field.state.meta.errors}
            />
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

        <form.Field name="photo">
          {(field) => (
            <div className="space-y-2">
              <span
                id={photoLabelId}
                className="block text-sm font-medium text-gray-700"
              >
                Profile Photo
              </span>
              <FilePond
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
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-red-600">
                  {String(field.state.meta.errors[0])}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {submitError && (
          <div className="text-red-600 text-sm">{submitError}</div>
        )}

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              data-onboarding-submit
              disabled={!canSubmit || isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Complete Profile"}
            </button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
};

export default OnboardingPage;
