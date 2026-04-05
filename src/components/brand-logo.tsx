import Image from "next/image";

const INTRINSIC_W = 1376;
const INTRINSIC_H = 768;

type BrandLogoProps = {
  variant?: "header" | "compact" | "sidebar" | "auth" | "footer" | "adminBar";
  className?: string;
  priority?: boolean;
};

const variantClass: Record<NonNullable<BrandLogoProps["variant"]>, string> = {
  header: "h-16 w-auto sm:h-20 md:h-24",
  compact: "h-14 w-auto max-w-[min(85vw,20rem)] sm:h-16 sm:max-w-[22rem]",
  sidebar:
    "h-16 w-auto max-w-[min(90vw,22rem)] rounded-lg bg-white px-3 py-3 shadow-sm ring-1 ring-black/5 sm:h-20 sm:max-w-[26rem]",
  auth: "h-20 w-auto sm:h-24",
  footer: "h-14 w-auto opacity-90 sm:h-16",
  adminBar: "h-9 w-auto",
};

export function BrandLogo({ variant = "header", className = "", priority }: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="24/7concept"
      width={INTRINSIC_W}
      height={INTRINSIC_H}
      priority={priority}
      className={`${variantClass[variant]}${className ? ` ${className}` : ""}`}
    />
  );
}
