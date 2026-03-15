"use client";

import { useEffect, useId, useState } from "react";
import { signUp } from "@/lib/auth-client";
import { checkUsernameAvailability, createUserProfile } from "./actions";
import Link from "vinext/shims/link";
import { useRouter } from "vinext/shims/navigation";
import { AuthLayout } from "../_components/auth-layout";

const MIN_USERNAME_LENGTH = 3;
const DEBOUNCE_DELAY = 300;
const ZERO_LENGTH = 0;

export default function SignUpPage() {
  const router = useRouter();
  const usernameId = useId();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"checking" | "available" | "taken" | null>(
    null,
  );
  const [isUsernameValid, setIsUsernameValid] = useState(false);

  useEffect(() => {
    if (!username || username.length < MIN_USERNAME_LENGTH) {
      setUsernameStatus(null);
      setIsUsernameValid(false);
      return;
    }

    setUsernameStatus("checking");
    const timeoutId = setTimeout(async () => {
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

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!isUsernameValid) {
      setError("Please choose an available username");
      setIsLoading(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Failed to sign up");
      } else {
        const createUserResult = await createUserProfile({
          id: result.data?.user?.id || "",
          name,
          email,
          username,
          image: result.data?.user?.image ?? null,
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join Tiny Tribe today">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor={usernameId} className="block text-sm font-medium text-tt-green-700 mb-1">
            Username
          </label>
          <input
            id={usernameId}
            name="username"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={20}
            pattern="^[a-zA-Z0-9_-]+$"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 bg-neutral-300 outline-none border-0 rounded-sm focus:ring-2 focus:ring-tt-green-500 transition-colors"
            placeholder="johndoe"
          />
          <div className="mt-1 flex items-center gap-2">
            {usernameStatus === "checking" && (
              <span className="text-sm text-gray-500">Checking availability...</span>
            )}
            {usernameStatus === "available" && (
              <span className="text-sm text-green-600">✓ Username available</span>
            )}
            {usernameStatus === "taken" && (
              <span className="text-sm text-red-600">✗ Username already taken</span>
            )}
            {usernameStatus === null &&
              username.length > ZERO_LENGTH &&
              username.length < MIN_USERNAME_LENGTH && (
                <span className="text-sm text-gray-500">
                  Username must be at least {MIN_USERNAME_LENGTH} characters
                </span>
              )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            3-20 characters, letters, numbers, underscores, and hyphens only
          </p>
        </div>

        <div>
          <label htmlFor={nameId} className="block text-sm font-medium text-tt-green-700 mb-1">
            Full name
          </label>
          <input
            id={nameId}
            name="name"
            type="text"
            autoComplete="name"
            required
            className="w-full px-4 py-2 bg-neutral-300 outline-none border-0 rounded-sm focus:ring-2 focus:ring-tt-green-500 transition-colors"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor={emailId} className="block text-sm font-medium text-tt-green-700 mb-1">
            Email address
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full px-4 py-2 bg-neutral-300 outline-none border-0 rounded-sm focus:ring-2 focus:ring-tt-green-500 transition-colors"
            placeholder="lebron@gmail.com"
          />
        </div>

        <div>
          <label htmlFor={passwordId} className="block text-sm font-medium text-tt-green-700 mb-1">
            Password
          </label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full px-4 py-2 bg-neutral-300 outline-none border-0 rounded-sm focus:ring-2 focus:ring-tt-green-500 transition-colors"
            placeholder="Create a password"
          />
          <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
        </div>

        <div>
          <label
            htmlFor={confirmPasswordId}
            className="block text-sm font-medium text-tt-green-700 mb-1"
          >
            Confirm password
          </label>
          <input
            id={confirmPasswordId}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="w-full px-4 py-2 bg-neutral-300 outline-none border-0 rounded-sm focus:ring-2 focus:ring-tt-green-500 transition-colors"
            placeholder="Confirm your password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !isUsernameValid}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-tt-green-600 hover:bg-tt-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tt-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading && "Creating account..."}
          {!isLoading && "Create account"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-tt-green-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
