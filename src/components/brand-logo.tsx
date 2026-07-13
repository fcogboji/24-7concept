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
    word: "text-3xl font-extrabold italic tracking-tight sm:text-4xl md:text-[2.75rem]",
    mark: "h-9 w-9 sm:h-10 sm:w-10",
  },
  compact: {
    wrap: "inline-flex items-center gap-2",
    word: "text-2xl font-extrabold italic tracking-tight sm:text-3xl",
    mark: "h-8 w-8",
  },
  sidebar: {
    wrap:
      "inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 shadow-sm ring-1 ring-black/5",
    word: "text-xl font-extrabold italic tracking-tight sm:text-2xl",
    mark: "h-7 w-7",
  },
  auth: {
    wrap: "inline-flex items-center gap-3",
    word: "text-4xl font-extrabold italic tracking-tight sm:text-5xl",
    mark: "h-11 w-11 sm:h-12 sm:w-12",
  },
  footer: {
    wrap: "inline-flex items-center gap-2",
    word: "text-2xl font-extrabold italic tracking-tight sm:text-3xl",
    mark: "h-8 w-8",
  },
  adminBar: {
    wrap: "inline-flex items-center gap-1.5",
    word: "text-base font-extrabold italic tracking-tight",
    mark: "h-5 w-5",
  },
};

const letterColors = [
  "#E53238", // eBay red
  "#0064D2", // eBay blue
  "#F5AF02", // eBay yellow
  "#86B817", // eBay green
];

const wordmark = "faztino";

/** Friendly human-like support-agent avatar used as the brand mark. */
function BrandMark({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="faztinoMarkGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      {/* Rounded badge */}
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="url(#faztinoMarkGrad)" />
      {/* Headset band */}
      <path
        d="M13 25c0-6 5-10.5 11-10.5S35 19 35 25"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Ear cups */}
      <rect x="10.5" y="24" width="5" height="9" rx="2.5" fill="#ffffff" />
      <rect x="32.5" y="24" width="5" height="9" rx="2.5" fill="#ffffff" />
      {/* Mic boom */}
      <path
        d="M35 32.5c0 4-3.4 6-7 6"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="26.5" cy="38.5" r="1.8" fill="#ffffff" />
      {/* Head */}
      <circle cx="24" cy="23" r="6" fill="#ffffff" />
      {/* Shoulders */}
      <path d="M14 40c0-6 4.5-9.5 10-9.5S34 34 34 40Z" fill="#ffffff" />
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
      <span className={styles.word} aria-hidden="true">
        {wordmark.split("").map((char, i) => (
          <span key={i} style={{ color: letterColors[i % letterColors.length] }}>
            {char}
          </span>
        ))}
      </span>
    </span>
  );
}
