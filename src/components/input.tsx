import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  value: string;
  onBlur: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors?: unknown[];
  helperText?: string;
}

export const Input = ({
  label,
  name,
  value,
  onBlur,
  onChange,
  errors = [],
  helperText,
  type = "text",
  placeholder,
  autoComplete,
  className = "",
  ...props
}: InputProps) => {
  const hasError = errors.length > 0;

  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-tt-green-700 mb-1"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onBlur={onBlur}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full px-4 py-2 bg-neutral-300 outline-none border-0 rounded-sm focus:ring-2 focus:ring-tt-green-500 transition-colors"
        {...props}
      />
      {hasError && (
        <p className="mt-1 text-sm text-red-600">
          {errors
            .filter(Boolean)
            .map((err) =>
              typeof err === "string"
                ? err
                : (err as { message?: string }).message || String(err),
            )
            .join(", ")}
        </p>
      )}
      {helperText && !hasError && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
