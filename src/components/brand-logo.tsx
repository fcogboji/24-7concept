type BrandLogoProps = {
  variant?: "header" | "compact" | "sidebar" | "auth" | "footer" | "adminBar";
  className?: string;
  priority?: boolean;
};

type VariantStyle = {
  wrap: string;
  word: string;
  mark: string;
};

const variantStyle: Record<NonNullable<BrandLogoProps["variant"]>, VariantStyle> = {
  header: {
    wrap: "inline-flex items-center gap-2.5",
    word: "text-[1.65rem] font-bold tracking-tight sm:text-[1.85rem] md:text-[2.1rem]",
    mark: "h-9 w-9 sm:h-10 sm:w-10",
  },
  compact: {
    wrap: "inline-flex items-center gap-2",
    word: "text-xl font-bold tracking-tight sm:text-2xl",
    mark: "h-8 w-8",
  },
  sidebar: {
    wrap:
      "inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 shadow-sm ring-1 ring-black/5",
    word: "text-lg font-bold tracking-tight sm:text-xl",
    mark: "h-7 w-7",
  },
  auth: {
    wrap: "inline-flex items-center gap-3",
    word: "text-3xl font-bold tracking-tight sm:text-4xl",
    mark: "h-11 w-11 sm:h-12 sm:w-12",
  },
  footer: {
    wrap: "inline-flex items-center gap-2",
    word: "text-xl font-bold tracking-tight sm:text-2xl",
    mark: "h-8 w-8",
  },
  adminBar: {
    wrap: "inline-flex items-center gap-1.5",
    word: "text-sm font-bold tracking-tight",
    mark: "h-5 w-5",
  },
};

/** Odoo-inspired palette used across brand + landing. */
export const BRAND = {
  teal: "#00A09D",
  purple: "#714B67",
  orange: "#F0A202",
  sky: "#00A3D3",
  emerald: "#00A04A",
  navy: "#1F2A44",
} as const;

/** Shared CSS classes for multicolour brand buttons (see globals.css). */
export const BTN_BRAND = "btn-brand";
export const BTN_BRAND_OUTLINE = "btn-brand-outline";

/** Inline gradient when a className alone is awkward (e.g. style= props). */
export const BRAND_MIX_GRADIENT =
  "linear-gradient(120deg, #00A09D 0%, #00A3D3 28%, #714B67 62%, #F0A202 100%)";

const letterColors = [
  BRAND.teal,
  BRAND.purple,
  BRAND.orange,
  BRAND.sky,
  BRAND.emerald,
  BRAND.teal,
  BRAND.purple,
];

const wordmark = "faztino";

/**
 * Geometric mark in the Odoo style: overlapping teal / purple / orange shapes
 * that read as a chat bubble + connection (conversation → booking).
 */
function BrandMark({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-hidden="true"
    >
      {/* Soft white tile like Odoo app icons */}
      <rect x="1" y="1" width="46" height="46" rx="11" fill="#ffffff" stroke="#E8E8E8" strokeWidth="1" />

      {/* Teal circle (back-left) */}
      <circle cx="18" cy="22" r="11" fill={BRAND.teal} fillOpacity="0.92" />
      {/* Purple circle (front-right) — overlaps teal */}
      <circle cx="30" cy="22" r="11" fill={BRAND.purple} fillOpacity="0.88" />
      {/* Orange accent bar / chat tail */}
      <rect x="14" y="31" width="14" height="5.5" rx="2.75" fill={BRAND.orange} transform="rotate(-18 14 31)" />
      {/* Small sky highlight for depth */}
      <circle cx="15.5" cy="16.5" r="3.2" fill={BRAND.sky} fillOpacity="0.85" />
    </svg>
  );
}

export function BrandLogo({ variant = "header", className = "" }: BrandLogoProps) {
  const styles = variantStyle[variant];
  return (
    <span
      className={`${styles.wrap}${className ? ` ${className}` : ""}`}
      aria-label="Faztino"
    >
      <BrandMark className={styles.mark} />
      <span
        className={`${styles.word} font-[family-name:var(--font-dm-sans)] not-italic`}
        aria-hidden="true"
      >
        {wordmark.split("").map((char, i) => (
          <span key={i} style={{ color: letterColors[i % letterColors.length] }}>
            {char}
          </span>
        ))}
      </span>
    </span>
  );
}
