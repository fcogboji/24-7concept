import "./globals.css";

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
