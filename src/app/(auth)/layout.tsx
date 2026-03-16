import { getAuth } from "@/lib/auth-server";
import { headers } from "vinext/shims/headers";

const metadata = {
  description: "Sign in or create an account",
  title: "Authentication - Tiny Tribe",
};

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  // console.log(session);
  return <>{children}</>;
};

export { metadata };
export default AuthLayout;
