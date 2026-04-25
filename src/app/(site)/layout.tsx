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
  themeColor: "#fafaf9",
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "faztino — AI support for your website",
  description:
    "Train an assistant on your site in minutes. One script tag, answers that sound like your team.",
  openGraph: {
    title: "faztino — AI support for your website",
    description:
      "Train an assistant on your site in minutes. One script tag, answers that sound like your team.",
    type: "website",
    locale: "en_GB",
    images: [
      {
        url: "/robot-chat-replies.png",
        width: 1200,
        height: 900,
        alt: "faztino AI assistant with chat replies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "faztino — AI support for your website",
    description:
      "Train an assistant on your site in minutes. One script tag, answers that sound like your team.",
    images: ["/robot-chat-replies.png"],
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
