"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import Link from "vinext/shims/link";
import { useSearchParams } from "vinext/shims/navigation";
import { AuthLayout } from "../_components/auth-layout";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/button";
import { Input } from "@/components/input";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    if ("INVALID_TOKEN" === errorParam) {
      setTokenError("This reset link has expired or is invalid. Please request a new one.");
    }
  }, [errorParam]);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      if (!token) {
        formApi.fieldInfo.password.instance?.setErrorMap({
          onSubmit: "Reset token is missing. Please request a new reset link.",
        });
        return;
      }

      try {
        const result = await authClient.resetPassword({
          newPassword: value.password,
          token,
        });

        if (result.error) {
          formApi.fieldInfo.password.instance?.setErrorMap({
            onSubmit: result.error.message || "Failed to reset password",
          });
        } else {
          setIsSuccess(true);
        }
      } catch {
        formApi.fieldInfo.password.instance?.setErrorMap({
          onSubmit: "An unexpected error occurred",
        });
      }
    },
  });

  if (isSuccess) {
    return (
      <AuthLayout title="Password reset successful" subtitle="Your password has been updated">
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Password updated!</p>
            <p className="text-sm mt-1">Your password has been successfully reset.</p>
          </div>

          <Link
            href="/sign-in"
            className="inline-flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-tt-green-600 hover:bg-tt-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tt-green-500 transition-colors"
          >
            Sign in with new password
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (tokenError) {
    return (
      <AuthLayout title="Invalid reset link" subtitle="This password reset link is invalid">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">{tokenError}</p>
          </div>

          <Link
            href="/forgot-password"
            className="inline-flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-tt-green-600 hover:bg-tt-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tt-green-500 transition-colors"
          >
            Request new reset link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (!token) {
    return (
      <AuthLayout title="Invalid reset link" subtitle="This password reset link is invalid">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Invalid or expired link</p>
            <p className="text-sm mt-1">Please request a new password reset link.</p>
          </div>

          <Link
            href="/forgot-password"
            className="inline-flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-tt-green-600 hover:bg-tt-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tt-green-500 transition-colors"
          >
            Request new reset link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your new password below">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <form.Field name="password">
          {(field) => (
            <Input
              label="New password"
              name={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              autoComplete="new-password"
              placeholder="Create a new password"
              errors={field.state.meta.errors}
              helperText="Must be at least 8 characters"
            />
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => (
            <Input
              label="Confirm new password"
              name={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              autoComplete="new-password"
              placeholder="Confirm your new password"
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting} isLoading={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset password"}
            </Button>
          )}
        </form.Subscribe>

        <div className="text-center">
          <Link href="/sign-in" className="text-sm font-medium text-tt-green-500 hover:underline">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
