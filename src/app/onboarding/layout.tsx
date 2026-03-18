import { redirect } from "vinext/shims/navigation";
import { UserAppService } from "@generated/client";
import { fetchWithSession } from "@/lib/fetch";
import type { Metadata } from "vinext/shims/metadata";

export const metadata: Metadata = {
  title: "Onboarding - Tiny Tribe",
  description: "Complete your Tiny Tribe profile setup",
};

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  try {
    const result = await UserAppService.hasOnboarded(fetchWithSession);

    if (!result.ok) {
      if (result.status === 401) {
        return redirect("/sign-in");
      }
      // Handle other errors
      console.error("Failed to check onboarding status:", result.message);
      return redirect("/error");
    }

    const hasOnboarded = Boolean(result.data);
    if (hasOnboarded) {
      return redirect("/home");
    }

    return <div className="min-h-screen flex flex-col bg-stone-200">{children}</div>;
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return redirect("/error");
  }
}
