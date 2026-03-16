"use client";

import { checkUsernameAvailability, createUserProfile } from "./actions";
import { signUp } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import Link from "vinext/shims/link";
import { useRouter } from "vinext/shims/navigation";
import { AuthLayout } from "../_components/auth-layout";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/button";
import { Input } from "@/components/input";

const MIN_USERNAME_LENGTH = 3;
const DEBOUNCE_DELAY = 300;

const signUpSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and hyphens",
      ),
    name: z.string().min(1, "Full name is required"),
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
  const [usernameStatus, setUsernameStatus] = useState<
    "checking" | "available" | "taken" | null
  >(null);
  const [isUsernameValid, setIsUsernameValid] = useState(false);

  const form = useForm({
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value }: { value: SignUpFormData }) => {
      if (!isUsernameValid) {
        setError("Please choose an available username");
        return;
      }

      setError(null);

      try {
        const result = await signUp.email({
          email: value.email,
          name: value.name,
          password: value.password,
        });

        if (result.error) {
          setError(result.error.message || "Failed to sign up");
        } else {
          const createUserResult = await createUserProfile({
            email: value.email,
            id: result.data?.user?.id || "",
            image: result.data?.user?.image ?? null,
            name: value.name,
            username: value.username,
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

  // Handle username availability checking
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const checkUsername = () => {
      const username = form.getFieldValue("username");

      if (!username || username.length < MIN_USERNAME_LENGTH) {
        setUsernameStatus(null);
        setIsUsernameValid(false);
        return;
      }

      // Validate username format first
      const usernameResult = signUpSchema.shape.username.safeParse(username);
      if (!usernameResult.success) {
        setUsernameStatus(null);
        setIsUsernameValid(false);
        return;
      }

      setUsernameStatus("checking");
      timeoutId = setTimeout(async () => {
        try {
          const result = await checkUsernameAvailability(username);

          if (result.ok && result.available) {
            setUsernameStatus("available");
            setIsUsernameValid(true);
          } else {
            setUsernameStatus("taken");
            setIsUsernameValid(false);
          }
        } catch {
          setUsernameStatus(null);
          setIsUsernameValid(false);
        }
      }, DEBOUNCE_DELAY);
    };

    // Subscribe to form value changes
    const subscription = form.store.subscribe(() => {
      checkUsername();
    });

    // Initial check
    checkUsername();

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [form.store, form]);

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

        <form.Field name="username">
          {(field) => (
            <div>
              <Input
                label="Username"
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                autoComplete="username"
                placeholder="johndoe"
                errors={field.state.meta.errors}
              />
              <div className="mt-1 flex items-center gap-2">
                {"checking" === usernameStatus && (
                  <span className="text-sm text-gray-500">
                    Checking availability...
                  </span>
                )}
                {"available" === usernameStatus && (
                  <span className="text-sm text-green-600">
                    Username available
                  </span>
                )}
                {"taken" === usernameStatus && (
                  <span className="text-sm text-red-600">
                    Username already taken
                  </span>
                )}
                {null === usernameStatus &&
                  field.state.value.length > 0 &&
                  field.state.value.length < MIN_USERNAME_LENGTH && (
                    <span className="text-sm text-gray-500">
                      Username must be at least {MIN_USERNAME_LENGTH} characters
                    </span>
                  )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                3-20 characters, letters, numbers, underscores, and hyphens only
              </p>
            </div>
          )}
        </form.Field>

        <form.Field name="name">
          {(field) => (
            <Input
              label="Full name"
              name={field.name}
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              autoComplete="name"
              placeholder="John Doe"
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

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
              disabled={!canSubmit || isSubmitting || !isUsernameValid}
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
