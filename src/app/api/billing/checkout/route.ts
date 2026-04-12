import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isPaystackEnabled } from "@/lib/paystack-env";

export const runtime = "nodejs";

async function detectCountry(): Promise<string | null> {
  const h = await headers();
  return (
    h.get("x-vercel-ip-country") ??
    h.get("cf-ipcountry") ??
    h.get("x-country") ??
    null
  );
}

export async function POST(req: Request) {
  const country = (await detectCountry())?.toUpperCase() ?? null;
  const useNaira = country === "NG" && isPaystackEnabled();
  const target = useNaira ? "/api/paystack/checkout" : "/api/stripe/checkout";

  const base = new URL(req.url);
  const forwardUrl = new URL(target, base);

  const res = await fetch(forwardUrl, {
    method: "POST",
    headers: { cookie: req.headers.get("cookie") ?? "" },
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
