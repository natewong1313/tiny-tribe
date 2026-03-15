"use client";

import { useEffect, useId, useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "vinext/shims/link";
import { useSearchParams } from "vinext/shims/navigation";
import { AuthLayout } from "../_components/auth-layout";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const passwordId = useId();
  const confirmPasswordId = useId();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ("INVALID_TOKEN" === errorParam) {
      setError("This reset link has expired or is invalid. Please request a new one.");
    }
  }, [errorParam]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!token) {
      setError("Reset token is missing. Please request a new reset link.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (result.error) {
        setError(result.error.message || "Failed to reset password");
      } else {
        setIsSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!token && !errorParam) {
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor={passwordId} className="block text-sm font-medium text-tt-green-700 mb-1">
            New password
          </label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full px-4 py-2 bg-neutral-300 outline-none border-0 rounded-sm focus:ring-2 focus:ring-tt-green-500 transition-colors"
            placeholder="Create a new password"
          />
          <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
        </div>

        <div>
          <label
            htmlFor={confirmPasswordId}
            className="block text-sm font-medium text-tt-green-700 mb-1"
          >
            Confirm new password
          </label>
          <input
            id={confirmPasswordId}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="w-full px-4 py-2 bg-neutral-300 outline-none border-0 rounded-sm focus:ring-2 focus:ring-tt-green-500 transition-colors"
            placeholder="Confirm your new password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-tt-green-600 hover:bg-tt-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tt-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading && "Resetting..."}
          {!isLoading && "Reset password"}
        </button>

        <div className="text-center">
          <Link href="/sign-in" className="text-sm font-medium text-tt-green-500 hover:underline">
            ← Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
