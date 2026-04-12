"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "nestbot_cookie_consent_v1";

export type ConsentValue = "accepted" | "essential";

export function CookieConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      setVisible(false);
      return;
    }
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v !== "accepted" && v !== "essential") {
        setVisible(true);
      } else {
        setVisible(false);
      }
    } catch {
      setVisible(true);
    }
  }, [pathname]);

  function save(choice: ConsentValue) {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[200] border-t border-stone-200 bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:p-5"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-sm leading-relaxed text-stone-700">
          <p className="font-medium text-stone-900">Cookies & privacy</p>
          <p className="mt-2">
            We use essential cookies to run the service (e.g. sign-in). If you are in the{" "}
            <strong>EEA</strong> or <strong>UK</strong>, we ask for your choice before we use
            non-essential cookies. You can read more in our{" "}
            <Link href="/privacy" className="font-medium text-teal-800 underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/privacy#cookies" className="font-medium text-teal-800 underline">
              cookie policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => save("essential")}
            className="min-h-12 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => save("accepted")}
            className="min-h-12 rounded-full bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 touch-manipulation"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
