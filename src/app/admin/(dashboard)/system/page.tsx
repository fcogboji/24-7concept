import Link from "next/link";
import { isEmailConfigured } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export default async function AdminSystemPage() {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const env = process.env.NODE_ENV;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "(not set)";
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? "(not set)";
  const openai = process.env.OPENAI_API_KEY ? "configured" : "missing";
  const stripe = process.env.STRIPE_SECRET_KEY ? "configured" : "missing";
  const authSecret = process.env.AUTH_SECRET ? "set" : "missing";
  const clerkPub = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "set" : "missing";
  const clerkSecret = process.env.CLERK_SECRET_KEY ? "set" : "missing";
  const emailFrom = process.env.EMAIL_FROM ?? "(not set)";
  const resend = process.env.RESEND_API_KEY ? "configured" : "missing";
  const transactionalEmail = isEmailConfigured() ? "ready (Resend + from)" : "incomplete";
  const upstash = process.env.UPSTASH_REDIS_REST_URL ? "configured (distributed limits)" : "missing (per-instance memory)";
  const healthDeep = process.env.HEALTH_CHECK_SECRET ? "set (DB check requires token)" : "unset (health is minimal only)";
  const widgetCors = process.env.WIDGET_ALLOWED_ORIGINS?.trim()
    ? "restricted origins"
    : "open (embed-friendly)";

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">System</h1>
      <p className="mt-1 text-sm text-stone-600">
        Operations snapshot — secret values are never shown. Customer-facing auth uses NextAuth; this admin uses Clerk.
      </p>

      <dl className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-5 text-sm shadow-sm">
        <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
          <dt className="text-stone-500">NODE_ENV</dt>
          <dd className="font-mono text-stone-900">{env}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
          <dt className="text-stone-500">NEXT_PUBLIC_APP_URL</dt>
          <dd className="max-w-full break-all font-mono text-stone-900">{appUrl}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
          <dt className="text-stone-500">NEXTAUTH_URL</dt>
          <dd className="max-w-full break-all font-mono text-stone-900">{nextAuthUrl}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
          <dt className="text-stone-500">Database</dt>
          <dd className={dbOk ? "font-medium text-teal-800" : "font-medium text-red-700"}>
            {dbOk ? "Connected" : "Error"}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
          <dt className="text-stone-500">AUTH_SECRET</dt>
          <dd className="font-mono text-stone-900">{authSecret}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
          <dt className="text-stone-500">OPENAI_API_KEY</dt>
          <dd className="font-mono text-stone-900">{openai}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
          <dt className="text-stone-500">STRIPE_SECRET_KEY</dt>
          <dd className="font-mono text-stone-900">{stripe}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
          <dt className="text-stone-500">UPSTASH_REDIS (rate limits)</dt>
          <dd className="max-w-[min(100%,20rem)] text-right font-mono text-xs text-stone-900">{upstash}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
          <dt className="text-stone-500">HEALTH_CHECK_SECRET</dt>
          <dd className="font-mono text-stone-900">{healthDeep}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
          <dt className="text-stone-500">Widget CORS</dt>
          <dd className="max-w-[min(100%,20rem)] text-right font-mono text-xs text-stone-900">{widgetCors}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
          <dt className="text-stone-500">Transactional email</dt>
          <dd className="font-mono text-stone-900">{transactionalEmail}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
          <dt className="text-stone-500">RESEND_API_KEY</dt>
          <dd className="font-mono text-stone-900">{resend}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
          <dt className="text-stone-500">EMAIL_FROM</dt>
          <dd className="max-w-full break-all font-mono text-xs text-stone-900">{emailFrom}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
          <dt className="text-stone-500">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</dt>
          <dd className="font-mono text-stone-900">{clerkPub}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-stone-500">CLERK_SECRET_KEY</dt>
          <dd className="font-mono text-stone-900">{clerkSecret}</dd>
        </div>
      </dl>

      <p className="mt-6 text-sm text-stone-600">
        Health:{" "}
        <Link href="/api/health" className="font-medium text-teal-800 underline" target="_blank" rel="noreferrer">
          /api/health
        </Link>{" "}
        returns <code className="rounded bg-stone-100 px-1 text-xs">{`{ ok: true }`}</code> publicly. Set{" "}
        <code className="rounded bg-stone-100 px-1 text-xs">HEALTH_CHECK_SECRET</code> and call with{" "}
        <code className="rounded bg-stone-100 px-1 text-xs">Authorization: Bearer …</code> or{" "}
        <code className="rounded bg-stone-100 px-1 text-xs">?token=…</code> for DB status.
      </p>
    </div>
  );
}
