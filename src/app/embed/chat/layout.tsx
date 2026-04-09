import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Chat",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function EmbedChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Fix the height chain (body only has min-h-full) and make background transparent for the embed iframe */}
      <style>{`html,body{height:100%!important;background:transparent!important;overflow:hidden!important;padding:0!important;margin:0!important}`}</style>
      <div className="h-full min-h-0 bg-transparent">{children}</div>
    </>
  );
}
