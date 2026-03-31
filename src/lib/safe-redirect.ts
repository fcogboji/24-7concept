/** Only allow same-origin paths; avoids open redirects from untrusted callbackUrl query params. */
export function safeAppRedirectPath(callbackUrl: string | undefined, appOrigin: string): string {
  if (!callbackUrl) return "/dashboard";
  try {
    const u = new URL(callbackUrl);
    const app = new URL(appOrigin);
    if (u.origin === app.origin) return `${u.pathname}${u.search}`;
  } catch {
    /* ignore */
  }
  return "/dashboard";
}
