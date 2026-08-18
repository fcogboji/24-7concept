"use client";

import { useState, type ReactNode } from "react";

export const WIDGET_GREEN = "#1C7C4A";
export const WIDGET_GREEN_SOFT = "#E9F4EE";

export type WidgetChannels = {
  whatsapp: string | null;
  phone: string | null;
};

export function PanelShell({
  children,
  onClose,
  onBack,
  header,
}: {
  children: ReactNode;
  onClose: () => void;
  onBack?: () => void;
  header: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mx-2 mb-2 flex min-h-0 max-h-[min(520px,calc(100dvh-72px))] flex-1 flex-col overflow-hidden rounded-[18px] border border-stone-200 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.15)]">
        <div className="flex items-start justify-between gap-2 rounded-t-[18px] px-4 py-3.5 text-white" style={{ background: WIDGET_GREEN }}>
          {onBack ? (
            <button
              type="button"
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
              aria-label="Back"
              onClick={onBack}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : null}
          <div className="min-w-0 flex-1">{header}</div>
          <button
            type="button"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
            aria-label="Close"
            onClick={onClose}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MenuIcon({ children, bg }: { children: ReactNode; bg: string }) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: bg, color: WIDGET_GREEN }}
      aria-hidden
    >
      {children}
    </span>
  );
}

export function LauncherMenu({
  brand,
  channels,
  onChat,
  onWhatsApp,
  onCall,
}: {
  brand: string;
  channels: WidgetChannels;
  onChat: () => void;
  onWhatsApp: () => void;
  onCall: () => void;
}) {
  const [hint, setHint] = useState<string | null>(null);

  function handleWhatsApp() {
    if (channels.whatsapp) {
      setHint(null);
      onWhatsApp();
      return;
    }
    setHint("WhatsApp isn’t connected yet — use live chat or call us.");
  }

  function handleCall() {
    if (channels.phone) {
      setHint(null);
      onCall();
      return;
    }
    setHint("Calling isn’t set up yet — use live chat or WhatsApp.");
  }

  const items = [
    {
      key: "chat",
      title: "Live chat",
      subtitle: "Chat with us",
      onClick: onChat,
      bg: WIDGET_GREEN_SOFT,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a7.5 7.5 0 01-7.5 7.5H8L4 22v-4.4A7.5 7.5 0 0112.5 4.5 7.5 7.5 0 0120 12z" />
        </svg>
      ),
    },
    {
      key: "whatsapp",
      title: "WhatsApp",
      subtitle: "Message us on WhatsApp",
      onClick: handleWhatsApp,
      bg: "#E8F8EE",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
          <path d="M12.04 2C6.5 2 2 6.36 2 11.74c0 1.72.46 3.4 1.34 4.88L2 22l5.55-1.44A10.2 10.2 0 0012.04 21.5C17.58 21.5 22 17.14 22 11.76 22 6.38 17.58 2 12.04 2zm5.92 14.55c-.25.7-1.45 1.29-2.01 1.37-.52.07-1.18.1-1.9-.12-.44-.13-1-.29-1.73-.57-3.04-1.16-5.02-4.05-5.17-4.24-.16-.2-1.28-1.7-1.28-3.24 0-1.54.8-2.3 1.09-2.62.28-.31.62-.39.83-.39h.6c.19 0 .45-.07.7.53.25.62.86 2.1.93 2.26.08.15.12.33.02.53-.1.2-.15.33-.3.5-.15.18-.31.4-.45.53-.15.15-.3.31-.13.6.16.3.73 1.2 1.56 1.95 1.08.96 1.98 1.26 2.28 1.4.3.15.47.12.65-.07.17-.2.73-.85.93-1.14.2-.3.4-.24.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.34.08.13.08.74-.17 1.45z" />
        </svg>
      ),
    },
    {
      key: "contact",
      title: "Contact us",
      subtitle: "Call us — we answer right away",
      onClick: handleCall,
      bg: WIDGET_GREEN_SOFT,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.6 3.8l2.2 2.2a1.2 1.2 0 010 1.7L7.6 9a12.5 12.5 0 007.4 7.4l1.3-1.2a1.2 1.2 0 011.7 0l2.2 2.2a1.2 1.2 0 010 1.7l-1.3 1.3c-.6.6-1.5.9-2.3.7A18.5 18.5 0 013.9 6.4c-.2-.8.1-1.7.7-2.3l1.3-1.3a1.2 1.2 0 011.7 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-stone-50/80 px-3 py-4">
      <div className="flex min-h-0 flex-1 flex-col justify-evenly gap-4">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="flex w-full items-center gap-3 rounded-2xl border border-stone-100 bg-white px-3 py-4 text-left shadow-sm transition hover:border-stone-200 hover:shadow-md"
          >
            <MenuIcon bg={item.bg}>{item.icon}</MenuIcon>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-stone-900">{item.title}</span>
              <span className="block text-[12px] text-stone-500">{item.subtitle}</span>
            </span>
            <svg className="ml-auto h-4 w-4 shrink-0 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>
      {hint && <p className="mt-3 px-1 text-center text-xs text-stone-500">{hint}</p>}
      <p className="shrink-0 pt-4 pb-1 text-center text-[11px] text-stone-400">
        Powered by <span className="font-medium text-stone-500">{brand || "faztino"}</span>
      </p>
    </div>
  );
}
