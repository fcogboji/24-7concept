import "./globals.css";
import type { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
};

/**
 * Minimal root shell. Main marketing + dashboard live under `app/(site)/` with Clerk + fonts.
 * `/embed/*` inherits only this layout so third-party iframes do not load Clerk or unused font preloads.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
