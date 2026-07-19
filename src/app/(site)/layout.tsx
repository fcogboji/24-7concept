import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { DM_Sans, Fraunces } from "next/font/google";
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

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
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
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "faztino — 24/7 receptionist for bookings & enquiries",
  description:
    "Stop missing appointments after hours. A receptionist-grade assistant for dentists, salons, estate agents, and law firms — trained on your site, books into your calendar.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Faztino",
  },
  openGraph: {
    title: "faztino — 24/7 receptionist for bookings & enquiries",
    description:
      "Stop missing appointments after hours. A receptionist-grade assistant for dentists, salons, estate agents, and law firms — trained on your site, books into your calendar.",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "faztino — 24/7 receptionist for bookings & enquiries",
    description:
      "Stop missing appointments after hours. A receptionist-grade assistant for dentists, salons, estate agents, and law firms — trained on your site, books into your calendar.",
  },
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <Providers>
        <div className={`${dmSans.variable} ${fraunces.variable} min-h-full font-sans`}>{children}</div>
      </Providers>
    </ClerkProvider>
  );
}
