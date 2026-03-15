"use client";

import { authClient } from "@/lib/auth-client";
import { useId, useState } from "react";
import Link from "vinext/shims/link";
import { AuthLayout } from "../_components/auth-layout";

const ForgotPasswordPage = () => {
  const emailId = useId();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;

    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        setError(result.error.message || "Failed to send reset email");
      } else {
        setIsSubmitted(true);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = () => {
    if (isLoading) {
      return "Sending...";
    }
    return "Send reset link";
  };

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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-tt-green-600 hover:bg-tt-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tt-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {buttonText()}
        </button>

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
