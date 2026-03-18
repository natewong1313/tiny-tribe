import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "black";
}

const BASE_STYLES =
  "w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const VARIANT_STYLES = {
  primary: "text-white bg-tt-green-600 hover:bg-tt-green-700 focus:ring-tt-green-500",
  secondary: "text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-tt-green-500",
  black: "text-white bg-black hover:bg-gray-800 focus:ring-gray-500",
} as const;

export const Button = ({
  children,
  isLoading = false,
  variant = "primary",
  disabled,
  className = "",
  type = "button",
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={isLoading || disabled}
      className={cn(BASE_STYLES, VARIANT_STYLES[variant], className)}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
