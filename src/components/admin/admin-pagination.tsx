import Link from "next/link";

export function AdminPagination({
  page,
  pages,
  total,
  basePath,
  extra,
}: {
  page: number;
  pages: number;
  total: number;
  basePath: string;
  extra?: Record<string, string | undefined>;
}) {
  function href(p: number) {
    const x = new URLSearchParams();
    for (const [k, v] of Object.entries(extra ?? {})) {
      if (v) x.set(k, v);
    }
    x.set("page", String(p));
    return `${basePath}?${x.toString()}`;
  }

  if (pages <= 1) {
    return (
      <p className="text-sm text-stone-500">
        {total} {total === 1 ? "row" : "rows"}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-stone-500">
        Page {page} of {pages} ({total} total)
      </span>
      {page > 1 && (
        <Link
          className="rounded-lg border border-stone-300 px-3 py-1.5 hover:bg-stone-50"
          href={href(page - 1)}
        >
          Previous
        </Link>
      )}
      {page < pages && (
        <Link
          className="rounded-lg border border-stone-300 px-3 py-1.5 hover:bg-stone-50"
          href={href(page + 1)}
        >
          Next
        </Link>
      )}
    </div>
  );
}
