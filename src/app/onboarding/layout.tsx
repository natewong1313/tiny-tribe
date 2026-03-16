import { hasOnboarded } from "@/actions/onboarding";
import { redirect } from "vinext/shims/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const onboardingResult = await hasOnboarded();

  if (onboardingResult.unauthorized) {
    return redirect("/sign-in");
  }
  if (onboardingResult.hasOnboarded) {
    return redirect("/home");
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-200">{children}</div>
  );
}
