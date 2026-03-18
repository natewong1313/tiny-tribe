import { Suspense } from "react";
import { ResetPasswordForm } from "./_components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tt-green-600" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
