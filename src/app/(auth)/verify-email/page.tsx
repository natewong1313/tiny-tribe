import { Suspense } from "react";
import { VerifyEmailForm } from "./_components/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tt-green-600" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
