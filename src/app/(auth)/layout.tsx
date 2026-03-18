import type { Metadata } from "vinext/shims/metadata";

const metadata: Metadata = {
  description: "Sign in or create an account",
  title: "Authentication - Tiny Tribe",
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export { metadata };
export default AuthLayout;
