import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Chat",
};

export default function EmbedChatLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-full min-h-0 bg-transparent">{children}</div>;
}
