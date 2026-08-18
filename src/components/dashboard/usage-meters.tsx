import { getWorkspaceUsage } from "@/lib/usage";

function Meter({
  label,
  used,
  limit,
  unit,
}: {
  label: string;
  used: number;
  limit: number;
  unit: string;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const warn = pct >= 80;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className={`text-xs font-medium ${warn ? "text-amber-800" : "text-gray-500"}`}>
          {used.toLocaleString()} / {limit.toLocaleString()} {unit}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${pct >= 100 ? "bg-red-600" : warn ? "bg-amber-500" : "bg-[#1C7C4A]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export async function UsageMeters({ userId }: { userId: string }) {
  const usage = await getWorkspaceUsage(userId);
  if (!usage || usage.chatLimit === 0) return null;

  const phonePct =
    usage.phoneMinutesLimit > 0
      ? Math.round((usage.phoneMinutesUsed / usage.phoneMinutesLimit) * 100)
      : 0;

  return (
    <section className="mb-10 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">This month&apos;s AI usage</h2>
          <p className="mt-1 text-sm text-gray-600">
            Chat is included generously. Phone minutes are metered so a busy line cannot run up an unexpected bill.
          </p>
        </div>
        {phonePct >= 80 && (
          <p className="text-sm font-medium text-amber-800">
            {phonePct >= 100 ? "Phone minutes used up" : `${phonePct}% of phone minutes used`}
          </p>
        )}
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Meter label="AI chat" used={usage.chatUsed} limit={usage.chatLimit} unit="messages" />
        <Meter
          label="AI phone"
          used={usage.phoneMinutesUsed}
          limit={usage.phoneMinutesLimit}
          unit="minutes"
        />
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Concurrent calls: {usage.concurrent} / {usage.concurrentLimit}. Extra minutes: email hello@faztino.com — we
        quote high-volume phone usage so it stays profitable for both of us.
      </p>
    </section>
  );
}
