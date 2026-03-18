import type { Metadata } from "vinext/shims/metadata";
import { Geist_Mono, Work_Sans } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const metadata: Metadata = {
  description: "Tiny Tribe - A minimal social network",
  title: "Tiny Tribe",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="en">
    <body className={`${workSans.variable} ${geistMono.variable} antialiased font-sans`}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </body>
  </html>
);

export { metadata };
export default RootLayout;
