import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkEmailVerifiedButton } from "@/components/admin/mark-email-verified-button";
import { prisma } from "@/lib/prisma";

function maskId(id: string | null | undefined): string {
  if (!id) return "—";
  if (id.length <= 12) return id;
  return `…${id.slice(-8)}`;
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      bots: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { messages: true, leads: true, sources: true } } },
      },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  if (!user) notFound();

  return (
    <div>
      <Link href="/admin/users" className="text-sm font-medium text-stone-500 hover:text-stone-800">
        ← Users
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">
        {user.email}
      </h1>
      {user.name && <p className="mt-1 text-sm text-stone-600">Name: {user.name}</p>}
      <p className="mt-1 text-sm text-stone-600">
        Plan: <span className="font-medium">{user.plan}</span>
        {user.subscriptionStatus && (
          <>
            {" "}
            · Subscription: {user.subscriptionStatus}
          </>
        )}
      </p>
      <p className="mt-1 text-sm text-stone-600">
        Email verified:{" "}
        {user.emailVerifiedAt ? (
          <span className="font-medium text-teal-800">
            {user.emailVerifiedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </span>
        ) : (
          <span className="font-medium text-amber-800">No</span>
        )}
      </p>
      <p className="mt-1 text-xs text-stone-500">
        Joined {user.createdAt.toLocaleString()} · User id{" "}
        <code className="rounded bg-stone-100 px-1">{user.id}</code>
      </p>

      <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Billing (Stripe)</p>
        <dl className="mt-2 space-y-1">
          <div className="flex flex-wrap gap-2">
            <dt className="text-stone-500">Customer</dt>
            <dd className="font-mono text-xs">{maskId(user.stripeCustomerId)}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-stone-500">Subscription</dt>
            <dd className="font-mono text-xs">{maskId(user.stripeSubscriptionId)}</dd>
          </div>
        </dl>
      </div>

      {!user.emailVerifiedAt && <MarkEmailVerifiedButton userId={user.id} />}

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-stone-500">Assistants</h2>
      <ul className="mt-2 space-y-2">
        {user.bots.length === 0 && <li className="text-sm text-stone-500">None</li>}
        {user.bots.map((b) => (
          <li key={b.id} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm">
            <span className="font-medium text-stone-900">{b.name}</span>
            <span className="text-stone-500">
              {" "}
              · {b._count.messages} msgs · {b._count.leads} leads · {b._count.sources} chunks
            </span>
            {b.isDemo && <span className="ml-2 rounded bg-stone-200 px-1.5 text-xs">demo</span>}
            <div className="mt-1 text-xs text-stone-400">{b.websiteUrl ?? "No URL"}</div>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-stone-500">Recent audit (this user)</h2>
      <ul className="mt-2 space-y-1 text-sm text-stone-700">
        {user.auditLogs.length === 0 && <li className="text-stone-500">None</li>}
        {user.auditLogs.map((a) => (
          <li key={a.id} className="flex flex-wrap gap-2 border-b border-stone-100 py-2">
            <span className="font-mono text-xs text-stone-500">
              {a.createdAt.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
            </span>
            <span className="font-medium">{a.action}</span>
            {a.resourceType && (
              <span className="text-stone-500">
                {a.resourceType}:{a.resourceId}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
