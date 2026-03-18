"use client";

import { Button } from "@/components/button";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { Input } from "@/components/input";
import { useId, useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { UserAppService } from "@generated/client";
import { useRouter } from "vinext/shims/navigation";
import useSWR from "swr";
import { FilePondUpload } from "./_components/FilePondUpload";
import { CheckmarkIcon } from "./_components/CheckmarkIcon";

const USERNAME_REGEX = /[^a-zA-Z0-9_]/g;

const onboardingSchema = z.object({
  name: z.string().trim().min(1, "Full name is required"),
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    )
    .refine((value) => !value.endsWith("_"), {
      message: "Username cannot end with underscore",
    }),
  photo: z.string().min(1, "Profile photo is required"),
});

type UsernameCheckResult = {
  available: boolean;
  error?: string;
};

const checkUsernameFetcher = async (
  username: string,
): Promise<UsernameCheckResult> => {
  if (!username.trim()) {
    return { available: false, error: "Username is required" };
  }

  const result = await UserAppService.isUsernameAvailable(
    username.trim(),
    fetch,
  );

  if (!result.ok) {
    return {
      available: false,
      error: result.message || "Failed to check username availability",
    };
  }

  if (!result.data) {
    return { available: false, error: "Username is already taken" };
  }

  return { available: true };
};

// Helper to format errors
function formatFirstError(errors: unknown[]): string {
  const firstError = errors.find(Boolean);
  if (typeof firstError === "string") {
    return firstError;
  }
  return (
    (firstError as { message?: string } | undefined)?.message ||
    String(firstError)
  );
}

const FormPage = () => {
  const router = useRouter();
  const photoLabelId = useId();
  const { data: _session } = useSession();
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [usernameToCheck, setUsernameToCheck] = useState("");
  const { data: usernameCheckData, isValidating: isCheckingUsername } = useSWR(
    usernameToCheck ? ["username-check", usernameToCheck] : null,
    () => checkUsernameFetcher(usernameToCheck),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2000,
    },
  );

  let usernameCheckState;
  if (!usernameToCheck) {
    usernameCheckState = { status: "idle" as const, error: null };
  } else if (isCheckingUsername) {
    usernameCheckState = { status: "checking" as const, error: null };
  } else if (usernameCheckData?.available) {
    usernameCheckState = { status: "available" as const, error: null };
  } else {
    usernameCheckState = {
      status: "unavailable" as const,
      error: usernameCheckData?.error || "Username is not available",
    };
  }

  const handlePhotoChange = useCallback(
    (fileName: string, file: File | null) => {
      setPhotoFile(file);
    },
    [],
  );

  const handleUsernameBlur = useCallback((username: string) => {
    setUsernameToCheck(username);
  }, []);

  const handleUsernameChange = useCallback(
    (value: string, fieldOnChange: (value: string) => void) => {
      // Only allow alphanumeric characters and underscores
      const sanitizedValue = value.replace(USERNAME_REGEX, "");
      setUsernameToCheck("");
      fieldOnChange(sanitizedValue);
    },
    [],
  );

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
      // Trigger username check if not already checked
      if (!usernameCheckData) {
        setUsernameToCheck(value.username);
        // Wait for SWR to fetch
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Re-check after potential fetch
      const checkResult =
        usernameCheckData || (await checkUsernameFetcher(value.username));

      if (!checkResult.available) {
        formApi.fieldInfo.username.instance?.setErrorMap({
          onSubmit: checkResult.error ?? "Username is already taken",
        });
        return;
      }

      if (!photoFile) {
        formApi.fieldInfo.photo.instance?.setErrorMap({
          onSubmit: "Photo is required",
        });
        return;
      }

      // Convert photo to bytes
      const photoBytes = await photoFile
        .arrayBuffer()
        .then((buffer) => new Uint8Array(buffer));

      // Call service to complete onboarding
      const result = await UserAppService.completeOnboarding(
        value.name,
        value.username,
        photoBytes,
        fetch,
      );

      if (!result.ok) {
        // Map error to appropriate field based on error message
        if (result.message?.includes("Username")) {
          formApi.fieldInfo.username.instance?.setErrorMap({
            onSubmit: result.message,
          });
        } else if (result.message?.includes("photo") || result.message?.includes("Photo")) {
          formApi.fieldInfo.photo.instance?.setErrorMap({
            onSubmit: result.message,
          });
        } else {
          formApi.fieldInfo.name.instance?.setErrorMap({
            onSubmit: result.message || "An unknown error occurred",
          });
        }
        return;
      }

      router.push("/onboarding/notifications");
      router.refresh();
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-8 flex flex-col min-h-screen"
    >
      <form.Field name="photo">
        {(field) => (
          <FilePondUpload
            photoLabelId={photoLabelId}
            onChange={(fileName, file) => {
              handlePhotoChange(fileName, file);
              field.handleChange(fileName);
            }}
            errors={
              field.state.meta.errors.length > 0
                ? [formatFirstError(field.state.meta.errors)]
                : undefined
            }
          />
        )}
      </form.Field>

      <form.Field name="username">
        {(field) => {
          const handleBlur = useCallback(() => {
            field.handleBlur();
            handleUsernameBlur(field.state.value);
          }, [field.handleBlur, field.state.value, handleUsernameBlur]);

          return (
            <div>
              <Input
                label="Username"
                name={field.name}
                value={field.state.value}
                onBlur={handleBlur}
                onChange={(e) =>
                  handleUsernameChange(e.target.value, field.handleChange)
                }
                placeholder="kingjames"
                errors={
                  usernameCheckState.error
                    ? [usernameCheckState.error, ...field.state.meta.errors]
                    : field.state.meta.errors
                }
                helperText={
                  usernameCheckState.status === "checking"
                    ? "Checking username availability..."
                    : "Only letters, numbers, and underscores allowed"
                }
              />
              {usernameCheckState.status === "available" && (
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-green-600">
                  <CheckmarkIcon className="h-4 w-4" />
                  Username available
                </p>
              )}
            </div>
          );
        }}
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
                usernameCheckState.status === "checking" ||
                usernameCheckState.status === "unavailable"
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
