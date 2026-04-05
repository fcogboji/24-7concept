"use client";

import { useEffect } from "react";

/**
 * Registers `public/sw.js` in production (and optionally in dev via env).
 * Skipped on the server and when the browser has no Service Worker API.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    const inProd = process.env.NODE_ENV === "production";
    const forceDev = process.env.NEXT_PUBLIC_ENABLE_SW_IN_DEV === "1";
    if (!inProd && !forceDev) return;
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* ignore registration failures (offline, wrong MIME, etc.) */
    });
  }, []);

  return null;
}
