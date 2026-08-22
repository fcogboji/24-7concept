import { LAND } from "@/lib/brand";

const CALENDAR_WEEKS = [
  [6, 7, 8, 9, 10],
  [13, 14, 15, 16, 17],
  [20, 21, 22, 23, 24],
] as const;

const SELECTED_DAY = 15;

function DotGrid() {
  return (
    <svg className="h-16 w-24" viewBox="0 0 96 64" fill="none" aria-hidden>
      {[...Array(4)].map((_, row) =>
        [...Array(6)].map((_, col) => (
          <circle key={`${row}-${col}`} cx={6 + col * 17} cy={6 + row * 17} r="2.5" fill={LAND.greenMid} opacity="0.35" />
        )),
      )}
    </svg>
  );
}

function Sparks() {
  return (
    <svg className="h-14 w-14" viewBox="0 0 56 56" fill="none" aria-hidden>
      <path d="M8 30 L22 16" stroke={LAND.greenMid} strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      <path d="M20 42 L36 26" stroke={LAND.greenMid} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <path d="M36 46 L48 34" stroke={LAND.greenMid} strokeWidth="3" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[78%] rounded-2xl rounded-tl-md bg-gray-100 px-3.5 py-2.5 text-sm leading-snug text-gray-700">
      {children}
    </div>
  );
}

function VisitorBubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md px-3.5 py-2.5 text-sm leading-snug text-white"
      style={{ backgroundColor: LAND.green }}
    >
      {children}
    </div>
  );
}

function BookingCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: LAND.ink }}>
          Book a Call
        </p>
        <span className="text-xs" style={{ color: LAND.green }} aria-hidden>
          »
        </span>
      </div>

      <p className="mt-2 text-xs sm:text-[10px] font-medium uppercase tracking-wide text-gray-400">May 2024</p>

      <div className="mt-1.5 grid grid-cols-5 gap-1 text-center text-xs sm:text-[10px] font-semibold text-gray-400">
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="mt-1 space-y-1">
        {CALENDAR_WEEKS.map((week, i) => (
          <div key={i} className="grid grid-cols-5 gap-1 text-center text-xs sm:text-[11px]">
            {week.map((day) => {
              const selected = day === SELECTED_DAY;
              return (
                <span
                  key={day}
                  className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full ${
                    selected ? "font-bold text-white" : "text-gray-600"
                  }`}
                  style={selected ? { backgroundColor: LAND.green } : undefined}
                >
                  {day}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-[11px] font-medium text-gray-600">
        10:00 AM
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </div>

      <div
        className="mt-2 rounded-lg py-2 text-center text-xs sm:text-[11px] font-semibold text-white"
        style={{ backgroundColor: LAND.green }}
      >
        Confirm Booking
      </div>
    </div>
  );
}

function LeadsStatCard() {
  return (
    <div className="w-[172px] rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_18px_45px_-20px_rgba(18,51,42,0.35)]">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: LAND.greenSoft }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={LAND.green} strokeWidth={2.2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 17l6-6 4 4 6-7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 8h5v5" />
        </svg>
      </span>
      <p className="mt-3 text-xs sm:text-[11px] font-medium text-gray-500">Leads Captured</p>
      <p className="text-2xl font-bold tracking-tight" style={{ color: LAND.ink }}>
        1,248
      </p>
      <p className="text-xs sm:text-[11px] font-semibold" style={{ color: LAND.green }}>
        +32% this month
      </p>
    </div>
  );
}

/**
 * Illustrative product mockup for the hero: a site with the widget open, mid-way
 * through answering a question and offering a booking slot.
 */
export function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
      {/* Decorative accents — hidden on small screens where space is tight */}
      <div
        className="pointer-events-none absolute -right-6 top-10 -z-10 hidden h-72 w-72 rounded-full border-[14px] lg:block"
        style={{ borderColor: LAND.greenSoft }}
        aria-hidden
      />
      <div className="pointer-events-none absolute -left-14 top-6 hidden lg:block" aria-hidden>
        <DotGrid />
      </div>
      <div className="pointer-events-none absolute -right-10 -top-4 hidden lg:block" aria-hidden>
        <Sparks />
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white shadow-[0_40px_80px_-40px_rgba(18,51,42,0.45)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          </span>
          <div className="mx-auto flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs sm:text-[10px] text-gray-400 shadow-sm">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <rect x="5" y="11" width="14" height="9" rx="2" strokeLinejoin="round" />
              <path strokeLinecap="round" d="M8 11V8a4 4 0 018 0v3" />
            </svg>
            yourbusiness.com
          </div>
        </div>

        {/* Widget panel */}
        <div className="px-4 pb-4 pt-4 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: LAND.ink }}
            >
              F
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: LAND.ink }}>
                Faztino AI Assistant
              </p>
              <p className="flex items-center gap-1 text-xs sm:text-[11px] text-gray-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: LAND.green }} />
                Online
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <AssistantBubble>Hi there! 👋 How can I help you today?</AssistantBubble>
            <VisitorBubble>I&apos;m interested in your services. Can I book a call?</VisitorBubble>
            <AssistantBubble>
              Absolutely! I&apos;d be happy to help you book a call. What&apos;s the best day for you?
            </AssistantBubble>
          </div>

          <div className="mt-3">
            <BookingCard />
          </div>

          <p className="mt-3 text-center text-xs sm:text-[10px] font-medium text-gray-400">✦ Powered by Faztino</p>
        </div>
      </div>

      <div className="absolute -bottom-8 -left-4 hidden sm:block lg:-left-12">
        <LeadsStatCard />
      </div>
    </div>
  );
}
