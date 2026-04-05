"use client";

import { CookieConsent } from "@/components/cookie-consent";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CookieConsent />
      <ServiceWorkerRegister />
    </>
  );
}
