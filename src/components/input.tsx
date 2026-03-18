"use client";

import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  value: string;
  onBlur: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors?: unknown[];
  helperText?: string;
  icon?: ReactNode;
}

export const Input = ({
  label,
  name,
  value,
  onBlur,
  onChange,
  errors = [],
  helperText,
  icon,
  type = "text",
  placeholder,
  autoComplete,
  className = "",
  ...props
}: InputProps) => {
  const hasError = errors.length > 0;
  const generatedId = useId();
  const inputId = `${name}-${generatedId}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-tt-green-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</div>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onBlur={onBlur}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          className={`w-full py-3 bg-neutral-300 outline-none border-0 rounded-lg focus:ring-2 focus:ring-tt-green-500 transition-colors ${icon ? "pl-10 pr-4" : "px-4"}`}
          {...props}
        />
      </div>
      {hasError && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {errors
            .filter(Boolean)
            .map((err) =>
              typeof err === "string" ? err : (err as { message?: string }).message || String(err),
            )
            .join(", ")}
        </p>
      )}
      {helperText && !hasError && (
        <p id={helperId} className="mt-1 text-xs text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};
