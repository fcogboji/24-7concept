/** Digits-only country calling code, no plus. */
const DIAL_DIGITS = /^\d{1,4}$/;
const LOCAL_DIGITS = /^\d{6,14}$/;

/**
 * Builds E.164 from a country dial code (`1`, `44`, `234`) and a local number.
 * Strips a leading `0` from the local part (common in UK/NG national format).
 */
export function toE164(countryDial: string, localNumber: string): string | null {
  const cc = countryDial.replace(/\D/g, "");
  let local = localNumber.replace(/\D/g, "");
  if (!DIAL_DIGITS.test(cc) || !local) return null;
  if (local.startsWith("0")) local = local.slice(1);
  if (local.startsWith(cc) && local.length > cc.length + 5) {
    local = local.slice(cc.length);
  }
  if (!LOCAL_DIGITS.test(local)) return null;
  const full = `${cc}${local}`;
  if (full.length < 8 || full.length > 15) return null;
  return `+${full}`;
}

export function normalizeE164(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}

export function e164Digits(e164: string): string {
  return e164.replace(/\D/g, "");
}

/** Stable placeholder so phone-only leads satisfy Lead.email (required). */
export function phonePlaceholderEmail(e164: string): string {
  const key = e164Digits(e164).slice(-12) || "unknown";
  return `phone+${key}@phone.faztino.local`;
}

export const WIDGET_DIAL_CODES = [
  { code: "1", label: "US/CA", flag: "🇺🇸" },
  { code: "44", label: "UK", flag: "🇬🇧" },
  { code: "234", label: "NG", flag: "🇳🇬" },
  { code: "233", label: "GH", flag: "🇬🇭" },
  { code: "27", label: "ZA", flag: "🇿🇦" },
  { code: "91", label: "IN", flag: "🇮🇳" },
  { code: "353", label: "IE", flag: "🇮🇪" },
  { code: "61", label: "AU", flag: "🇦🇺" },
  { code: "49", label: "DE", flag: "🇩🇪" },
  { code: "33", label: "FR", flag: "🇫🇷" },
] as const;
