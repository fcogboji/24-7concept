import Link from "next/link";

export function LegalFooterLinks({ className = "" }: { className?: string }) {
  return (
    <nav className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm ${className}`}>
      <Link href="/privacy" className="text-stone-500 hover:text-stone-800">
        Privacy
      </Link>
      <span className="text-stone-300" aria-hidden>
        ·
      </span>
      <Link href="/terms" className="text-stone-500 hover:text-stone-800">
        Terms
      </Link>
    </nav>
  );
}
