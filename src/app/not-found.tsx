import Link from "vinext/shims/link";
import type { Metadata } from "vinext/shims/metadata";

export const metadata: Metadata = {
  title: "Page Not Found | Tiny Tribe",
  description: "The page you're looking for doesn't exist",
};

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-200 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-tt-green-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Page not found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-tt-green-600 hover:bg-tt-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tt-green-500 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
