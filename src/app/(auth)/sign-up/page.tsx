"use client";

import { createUserProfile } from "./actions";
import { signUp } from "@/lib/auth-client";
import { useState } from "react";
import Link from "vinext/shims/link";
import { useRouter } from "vinext/shims/navigation";
import { AuthLayout } from "../_components/auth-layout";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/button";
import { Input } from "@/components/input";

const signUpSchema = z
  .object({
    email: z.email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

const SignUpPage = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value }: { value: SignUpFormData }) => {
      setError(null);

      try {
        const result = await signUp.email({
          email: value.email,
          name: "",
          password: value.password,
        });

        if (result.error) {
          setError(result.error.message || "Failed to sign up");
        } else {
          const createUserResult = await createUserProfile({
            email: value.email,
            id: result.data?.user?.id || "",
          });

          if (!createUserResult.ok) {
            setError(createUserResult.error || "Failed to create user profile");
            return;
          }

          router.push("/");
          router.refresh();
        }
      } catch {
        setError("An unexpected error occurred");
      }
    },
  });

  return (
    <AuthLayout title="Create your account" subtitle="Join Tiny Tribe today">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

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

        <form.Field name="password">
          {(field) => (
            <Input
              label="Password"
              name={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              autoComplete="new-password"
              placeholder="Create a password"
              errors={field.state.meta.errors}
              helperText="Must be at least 8 characters"
            />
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => (
            <Input
              label="Confirm password"
              name={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              autoComplete="new-password"
              placeholder="Confirm your password"
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          )}
        </form.Subscribe>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-tt-green-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignUpPage;
