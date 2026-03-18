"use client";

import { authClient } from "@/lib/auth-client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "vinext/shims/link";
import { useSearchParams } from "vinext/shims/navigation";
import { AuthLayout } from "../../_components/auth-layout";

export const VerifyEmailForm = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAttempted = useRef(false);

  const verifyToken = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await authClient.verifyEmail({
        query: { token },
      });

      if (result.error) {
        setError(result.error.message || "Failed to verify email");
      } else {
        setIsSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsVerifying(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && !hasAttempted.current) {
      hasAttempted.current = true;
      verifyToken();
    }
  }, [token, verifyToken]);

  if (isVerifying) {
    return (
      <AuthLayout
        title="Verifying your email"
        subtitle="Please wait while we verify your email address"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-tt-green-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Verifying...</p>
        </div>
      </AuthLayout>
    );
  }

  if (isSuccess) {
    return (
      <AuthLayout title="Email verified!" subtitle="Your email has been successfully verified">
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Success!</p>
            <p className="text-sm mt-1">
              Your email address has been verified. You can now use all features of your account.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-tt-green-600 hover:bg-tt-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tt-green-500 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (error || !token) {
    return (
      <AuthLayout title="Verification failed" subtitle="We couldn't verify your email address">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">{error || "Invalid verification link"}</p>
            <p className="text-sm mt-1">
              The verification link may have expired or is invalid. Please try signing in or request
              a new verification email.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/sign-in"
              className="block w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-tt-green-600 hover:bg-tt-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tt-green-500 transition-colors"
            >
              Sign in
            </Link>

            <Link
              href="/"
              className="block w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tt-green-500 transition-colors"
            >
              Go home
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return null;
};
