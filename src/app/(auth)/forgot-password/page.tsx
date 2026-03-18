"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import Link from "vinext/shims/link";
import { AuthLayout } from "../_components/auth-layout";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/button";
import { Input } from "@/components/input";

const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

const ForgotPasswordPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const result = await authClient.requestPasswordReset({
          email: value.email,
          redirectTo: "/reset-password",
        });

        if (result.error) {
          formApi.fieldInfo.email.instance?.setErrorMap({
            onSubmit: result.error.message || "Failed to send reset email",
          });
        } else {
          setIsSubmitted(true);
        }
      } catch {
        formApi.fieldInfo.email.instance?.setErrorMap({
          onSubmit: "An unexpected error occurred",
        });
      }
    },
  });

  if (isSubmitted) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent you a password reset link">
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Reset link sent!</p>
            <p className="text-sm mt-1">
              Check your email for instructions to reset your password.
            </p>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>

          <button
            type="button"
            onClick={() => setIsSubmitted(false)}
            className="text-tt-green-500 hover:underline font-medium"
          >
            Try again
          </button>

          <div className="mt-8">
            <Link href="/sign-in" className="text-sm font-medium text-tt-green-500 hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <form.Field name="email">
          {(field) => (
            <Input
              label="Email address"
              name={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              autoComplete="email"
              placeholder="lebron@gmail.com"
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting} isLoading={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send reset link"}
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

export default ForgotPasswordPage;
