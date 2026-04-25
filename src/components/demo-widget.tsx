"use client";

import { useEffect } from "react";

export function DemoWidget({ scriptSrc }: { scriptSrc: string }) {
  useEffect(() => {
    const botId = process.env.NEXT_PUBLIC_DEMO_BOT_ID;
    if (!botId || typeof window === "undefined") return;

    const existing = document.querySelector('script[data-faztino-widget="1"]');
    if (existing) return;

    const s = document.createElement("script");
    s.src = scriptSrc;
    s.async = true;
    s.setAttribute("data-faztino-widget", "1");
    s.dataset.botId = botId;
    s.setAttribute("data-brand", "faztino");
    document.body.appendChild(s);

    return () => {
      s.remove();
    };
  }, []);

  return null;
}
