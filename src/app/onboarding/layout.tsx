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
  }

  const hasOnboarded = Boolean(result.data);
  if (hasOnboarded) {
    return redirect("/home");
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-200">{children}</div>
  );
}
