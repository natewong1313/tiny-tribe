import { getAuth } from "@/lib/auth-server";
import Nav from "./_components/nav";
import { headers } from "vinext/shims/headers";
import { redirect } from "vinext/shims/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return redirect("/sign-in");
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
