export function DashboardPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-4 border-b border-gray-200/80 pb-6 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-gray-600 sm:text-base">{subtitle}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full min-w-0 flex-shrink-0 flex-row flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
