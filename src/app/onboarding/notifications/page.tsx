"use client";

import { Button } from "@/components/button";
import { useForm } from "@tanstack/react-form";
import { UserAppService } from "@generated/client";
import { z } from "zod";
import { useRouter } from "vinext/shims/navigation";
import dynamic from "next/dynamic";
import { useId } from "react";
import "react-phone-number-input/style.css";

// Dynamically import PhoneInput since it's only needed when text is selected
const PhoneInput = dynamic(() => import("react-phone-number-input"), {
  ssr: false,
  loading: () => <div className="h-10 bg-gray-100 animate-pulse rounded" />,
});

interface NotificationOptionProps {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

const NotificationOption = ({ label, description, selected, onClick }: NotificationOptionProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left rounded-lg p-4 border transition-colors ${
      selected ? "border-tt-green-600 bg-tt-green-50" : "border-stone-300 bg-stone-100"
    }`}
  >
    <p className="font-medium">{label}</p>
    <p className="text-sm text-stone-600">{description}</p>
  </button>
);

const notificationsSchema = z
  .object({
    notificationType: z
      .string()
      .refine((value) => value === "email" || value === "text", "Select a notification type"),
    phoneNumber: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.notificationType === "text" && !value.phoneNumber.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["phoneNumber"],
        message: "Phone number is required for text notifications",
      });
    }
  });

function formatFirstError(errors: unknown[]): string {
  const firstError = errors.find(Boolean);
  if (typeof firstError === "string") {
    return firstError;
  }
  return (firstError as { message?: string } | undefined)?.message || String(firstError);
}

const NotificationsPage = () => {
  const router = useRouter();
  const phoneInputId = useId();

  const form = useForm({
    defaultValues: {
      notificationType: "",
      phoneNumber: "",
    },
    validators: {
      onSubmit: notificationsSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const saveResult = await UserAppService.updateNotificationPreference(
        value.notificationType,
        value.notificationType === "text" ? value.phoneNumber.trim() : "",
        fetch,
      );

      if (!saveResult.ok) {
        formApi.fieldInfo.notificationType.instance?.setErrorMap({
          onSubmit:
            saveResult.message && saveResult.message !== "{}"
              ? saveResult.message
              : "Failed to save notification preferences",
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
      <div>
        <h1 className="text-2xl font-semibold mb-2">Post notifications</h1>
        <p className="text-neutral-500">
          Choose how you want to get notified when your child has a new post.
        </p>
      </div>

      <form.Field name="notificationType">
        {(field) => {
          const handleEmailClick = () => field.handleChange("email");
          const handleTextClick = () => field.handleChange("text");

          return (
            <div className="space-y-3">
              <NotificationOption
                label="Email notifications"
                description="Receive updates by email."
                selected={field.state.value === "email"}
                onClick={handleEmailClick}
              />

              <NotificationOption
                label="Text notifications"
                description="Receive updates by SMS."
                selected={field.state.value === "text"}
                onClick={handleTextClick}
              />

              {field.state.meta.errors.length > 0 ? (
                <p className="text-sm text-red-600">{formatFirstError(field.state.meta.errors)}</p>
              ) : null}
            </div>
          );
        }}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.notificationType}>
        {(notificationType) =>
          notificationType === "text" ? (
            <form.Field name="phoneNumber">
              {(field) => (
                <div>
                  <label
                    htmlFor={phoneInputId}
                    className="block text-sm font-medium text-tt-green-700 mb-1"
                  >
                    Phone number
                  </label>
                  <PhoneInput
                    id={phoneInputId}
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="US"
                    value={field.state.value || undefined}
                    onChange={(value) => field.handleChange(value || "")}
                    className="phone-input-custom"
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <p className="mt-1 text-sm text-red-600">
                      {formatFirstError(field.state.meta.errors)}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>
          ) : null
        }
      </form.Subscribe>

      <div className="mt-auto">
        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
            notificationType: state.values.notificationType,
          })}
        >
          {({ canSubmit, isSubmitting, notificationType }) => (
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!canSubmit || isSubmitting || !notificationType}
            >
              {isSubmitting ? "Saving..." : "Continue"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};

export default NotificationsPage;
