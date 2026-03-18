"use client";

import Link from "vinext/shims/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-200 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-8">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>

        {error.digest && <p className="text-sm text-gray-500 mb-8">Error ID: {error.digest}</p>}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-tt-green-600 hover:bg-tt-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tt-green-500 transition-colors"
          >
            Try again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tt-green-500 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
