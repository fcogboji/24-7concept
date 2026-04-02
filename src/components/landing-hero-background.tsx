/**
 * Hero background:
 * - Below lg: full-height navy rectangle, centered with white side gutters (sharp corners).
 * - lg+: curved SVG split (navy left / white right).
 */
export function LandingHeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-white">
      {/* Mobile / tablet: solid rectangular panel — not a curved split */}
      <div
        className="absolute inset-y-0 left-4 right-4 bg-[#002147] lg:hidden"
        aria-hidden
      />
      {/* Desktop: original wide organic split */}
      <svg
        className="absolute inset-0 hidden h-full w-full min-h-[100%] lg:block"
        viewBox="0 0 1200 640"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="#002147"
          d="M0 0 L900 0 C820 100 720 200 600 300 C450 420 200 500 0 560 L0 640 L0 0 Z"
        />
      </svg>
    </div>
  );
}
