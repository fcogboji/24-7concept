type BrandLogoProps = {
  variant?: "header" | "compact" | "sidebar" | "auth" | "footer" | "adminBar";
  className?: string;
  priority?: boolean;
};

type VariantStyle = {
  wrap: string;
  word: string;
};

const variantStyle: Record<NonNullable<BrandLogoProps["variant"]>, VariantStyle> = {
  header: {
    wrap: "inline-flex items-center",
    word: "text-3xl font-extrabold italic tracking-tight sm:text-4xl md:text-[2.75rem]",
  },
  compact: {
    wrap: "inline-flex items-center",
    word: "text-2xl font-extrabold italic tracking-tight sm:text-3xl",
  },
  sidebar: {
    wrap:
      "inline-flex items-center rounded-lg bg-white px-3 py-2.5 shadow-sm ring-1 ring-black/5",
    word: "text-xl font-extrabold italic tracking-tight sm:text-2xl",
  },
  auth: {
    wrap: "inline-flex items-center",
    word: "text-4xl font-extrabold italic tracking-tight sm:text-5xl",
  },
  footer: {
    wrap: "inline-flex items-center",
    word: "text-2xl font-extrabold italic tracking-tight sm:text-3xl",
  },
  adminBar: {
    wrap: "inline-flex items-center",
    word: "text-base font-extrabold italic tracking-tight",
  },
};

const letterColors = [
  "#E53238", // eBay red
  "#0064D2", // eBay blue
  "#F5AF02", // eBay yellow
  "#86B817", // eBay green
];

const wordmark = "faztino";

export function BrandLogo({ variant = "header", className = "" }: BrandLogoProps) {
  const styles = variantStyle[variant];
  return (
    <span
      className={`${styles.wrap}${className ? ` ${className}` : ""}`}
      aria-label="Faztino"
    >
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
