import Nav from "./_components/nav";
import { redirect } from "vinext/shims/navigation";
import { UserAppService } from "@generated/client";
import { fetchWithSession } from "@/lib/fetch";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await UserAppService.hasOnboarded(fetchWithSession);

  if (!result.ok) {
    if (result.status === 401) {
      return redirect("/sign-in");
    }
    return redirect("/onboarding/welcome");
  }

  const hasOnboarded = Boolean(result.data);
  if (!hasOnboarded) {
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
