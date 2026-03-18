"use client";

import { signUp } from "@/lib/auth-client";
import { User } from "@generated/client";

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

const SignUpPage = () => {
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const result = await signUp.email({
        email: value.email,
        name: "",
        password: value.password,
      });
      if (result.error) {
        formApi.fieldInfo.email.instance?.setErrorMap({
          onSubmit: result.error.message || "Failed to sign up",
        });
        return;
      }
      const { id, email } = result.data.user;
      try {
        const createResult = await User.SAVE({
          id,
          email,
          name: "",
          username: "",
          email_verified: false,
          image: null,
          created_at: new Date(),
          updated_at: new Date(),
        });
        if (!createResult.ok) {
          formApi.fieldInfo.email.instance?.setErrorMap({
            onSubmit: createResult.message ?? "Failed to create user",
          });
          return;
        }
        router.push("/");
        router.refresh();
      } catch (e) {
        formApi.fieldInfo.email.instance?.setErrorMap({
          onSubmit: (e as Error).message,
        });
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

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting} isLoading={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          )}
        </form.Subscribe>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-tt-green-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignUpPage;
