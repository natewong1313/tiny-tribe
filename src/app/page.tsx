import Link from "vinext/shims/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-stone-300">
      <img src="/logo.svg" className="h-12 w-12 rounded-md mb-8" />
      <h1 className="font-semibold text-lg">Welcome to Tiny Tribe</h1>
      <p className="text-tt-green-600">Tiny Tribe is a minmal social network</p>
      <Link
        className="mt-4 bg-tt-green-600 text-stone-50 rounded-md px-4 py-2"
        href="/sign-in"
      >
        Sign up
      </Link>
    </div>
  );
}
