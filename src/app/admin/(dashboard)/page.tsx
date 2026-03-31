import { getAdminOverviewStats } from "@/lib/admin-stats";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900 sm:text-3xl">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const s = await getAdminOverviewStats();

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900 sm:text-3xl">
        Overview
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        Product health, usage, and growth at a glance.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={s.totalUsers} />
        <StatCard
          label="Unverified emails"
          value={s.unverifiedUsers}
          hint="Have not completed email verification"
        />
        <StatCard label="Pro workspaces" value={s.proUsers} hint="Stripe plan = pro" />
        <StatCard label="Assistants (bots)" value={s.totalBots} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Messages (all time)" value={s.totalMessages} />
        <StatCard label="Widget leads (all time)" value={s.totalLeads} />
        <StatCard
          label="New users (7 days)"
          value={s.usersLast7d}
          hint={
            s.signupGrowthPct === null
              ? "No prior week to compare"
              : `${s.signupGrowthPct >= 0 ? "+" : ""}${s.signupGrowthPct}% vs prior 7 days`
          }
        />
        <StatCard label="Messages (7 days)" value={s.messagesLast7d} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Messages (24 hours)" value={s.messagesLast24h} />
        <StatCard
          label="Audit events (24 hours)"
          value={s.auditLast24h}
          hint="Registrations, training, leads, admin actions"
        />
      </div>
    </div>
  );
}
