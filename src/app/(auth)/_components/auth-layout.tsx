"use client";

import Link from "vinext/shims/link";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  subtitle?: string;
  showHero?: boolean;
  title: string;
}

export const AuthLayout = ({ children, title, subtitle, showHero = true }: AuthLayoutProps) => (
  <div className="min-h-screen flex bg-stone-200">
    <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24">
      <div className="max-w-md w-full mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
          >
            <img alt="Tiny Tribe Logo" src="/logo.svg" className="h-12 w-12 rounded-md mb-8" />
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        {subtitle && <p className="text-gray-600 mb-8">{subtitle}</p>}

        {children}
      </div>
    </div>

    {/* Hero Side */}
    {showHero && (
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-tt-green-700 via-tt-green-600 to-tt-green-500 items-center justify-center">
        <div className="max-w-lg text-center text-white px-12">
          <h2 className="text-4xl font-bold mb-6">Welcome to Tiny Tribe</h2>
          <p className="text-xl text-white/90">
            Join our community and start building amazing things together.
          </p>
        </div>
      </div>
    )}
  </div>
);
