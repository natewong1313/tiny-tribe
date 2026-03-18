"use client";

export function CheckmarkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.415 0l-3-3a1 1 0 111.414-1.42L8.5 12.09l6.79-6.8a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
