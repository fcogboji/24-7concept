import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { DM_Sans, Fraunces } from "next/font/google";
import { getConfiguredAppOrigin } from "@/lib/app-origin";
import { Providers } from "../providers";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const appUrl = getConfiguredAppOrigin();
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (process.env.NODE_ENV === "production" && !clerkPublishableKey?.trim()) {
  throw new Error(
    "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Set it in Vercel → Environment Variables for Production, then redeploy."
  );
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#00A09D",
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "faztino — Convert website visitors into leads & bookings",
  description:
    "AI website assistant for local businesses. Answers questions, captures leads, and books appointments — trained on your site.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Faztino",
  },
  openGraph: {
    title: "faztino — Convert website visitors into leads & bookings",
    description:
      "AI website assistant for local businesses. Answers questions, captures leads, and books appointments — trained on your site.",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "faztino — Convert website visitors into leads & bookings",
    description:
      "AI website assistant for local businesses. Answers questions, captures leads, and books appointments — trained on your site.",
  },
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Absolute www URLs override Clerk Dashboard Paths that still point at apex
  // (https://faztino.com), which mints host-scoped cookies on the wrong host.
  const afterAuth = `${appUrl}/dashboard`;

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInUrl="/login"
      signUpUrl="/register"
      afterSignOutUrl="/"
      signInFallbackRedirectUrl={afterAuth}
      signUpFallbackRedirectUrl={afterAuth}
      signInForceRedirectUrl={afterAuth}
      signUpForceRedirectUrl={afterAuth}
    >
      <Providers>
        <div className={`${dmSans.variable} ${fraunces.variable} min-h-full font-sans`}>{children}</div>
      </Providers>
    </ClerkProvider>
  );
}
