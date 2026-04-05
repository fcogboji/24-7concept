"use client";

import { useEffect } from "react";

export function DemoWidget({ scriptSrc }: { scriptSrc: string }) {
  useEffect(() => {
    const botId = process.env.NEXT_PUBLIC_DEMO_BOT_ID;
    if (!botId || typeof window === "undefined") return;

    const existing = document.querySelector('script[data-247concept-widget="1"]');
    if (existing) return;

    const s = document.createElement("script");
    s.src = scriptSrc;
    s.async = true;
    s.setAttribute("data-247concept-widget", "1");
    s.dataset.botId = botId;
    s.setAttribute("data-brand", "24/7concept");
    document.body.appendChild(s);

    return () => {
      s.remove();
    };
  }, []);

  return null;
}
