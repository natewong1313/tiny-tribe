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

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-tt-green-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onBlur={onBlur}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`w-full py-3 bg-neutral-300 outline-none border-0 rounded-lg focus:ring-2 focus:ring-tt-green-500 transition-colors ${icon ? "pl-10 pr-4" : "px-4"}`}
          {...props}
        />
      </div>
      {hasError && (
        <p className="mt-1 text-sm text-red-600">
          {errors
            .filter(Boolean)
            .map((err) =>
              typeof err === "string" ? err : (err as { message?: string }).message || String(err),
            )
            .join(", ")}
        </p>
      )}
      {helperText && !hasError && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};
