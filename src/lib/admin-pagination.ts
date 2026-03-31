/** Default page size for admin list views (bots, messages, leads, activity). */
export const ADMIN_LIST_PAGE_SIZE = 40;

export function parseAdminPage(raw: string | undefined): number {
  return Math.max(1, parseInt(raw ?? "1", 10) || 1);
}

export function adminPageHref(
  basePath: string,
  page: number,
  extra?: Record<string, string | undefined>
): string {
  const x = new URLSearchParams();
  for (const [k, v] of Object.entries(extra ?? {})) {
    if (v) x.set(k, v);
  }
  x.set("page", String(page));
  return `${basePath}?${x.toString()}`;
}
