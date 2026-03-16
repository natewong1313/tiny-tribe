import Nav from "./_components/nav";
import { redirect } from "vinext/shims/navigation";
import { hasOnboarded } from "@/actions/onboarding";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const onboardingResult = await hasOnboarded();

  if (onboardingResult.unauthorized) {
    return redirect("/sign-in");
  }
  if (!onboardingResult.hasOnboarded) {
    return redirect("/onboarding/welcome");
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-200">
      <div className="flex-1 overflow-y-auto pb-16">{children}</div>
      <div className="fixed bottom-0 left-0 right-0">
        <Nav />
      </div>
    </div>
  );
}
