"use client";

import { useId, useState } from "react";
import { signIn } from "@/lib/auth-client";
import Link from "vinext/shims/link";
import { useRouter } from "vinext/shims/navigation";
import { AuthLayout } from "../_components/auth-layout";

export default function SignInPage() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const _rememberMeId = useId();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Failed to sign in");
      } else {
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
    <AuthLayout
      title="Sign in to your account"
      subtitle="Enter your email and password to continue"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

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
          <div className="flex items-center justify-between">
            <label
              htmlFor={passwordId}
              className="block text-sm font-medium text-tt-green-700 mb-1"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-tt-green-500 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full px-4 py-2 bg-neutral-300 outline-none border-0 rounded-sm focus:ring-2 focus:ring-tt-green-500 transition-colors"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-tt-green-600 hover:bg-tt-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tt-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading && "Signing in..."}
          {!isLoading && "Sign in"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-tt-green-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
