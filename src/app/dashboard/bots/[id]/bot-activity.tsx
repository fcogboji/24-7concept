type Msg = {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
};

type LeadRow = {
  id: string;
  email: string;
  createdAt: Date;
};

function clip(s: string, n: number) {
  const t = s.trim();
  return t.length <= n ? t : t.slice(0, n) + "…";
}

export function BotActivity({ messages, leads }: { messages: Msg[]; leads: LeadRow[] }) {
  const chronological = [...messages].reverse();

  return (
    <div className="mt-12 space-y-10 border-t border-stone-200 pt-12">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Email leads (widget)
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Visitors can leave an address after a couple of messages. Export or CRM sync can come later.
        </p>
        {leads.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
            No leads yet — embed the script and let conversations run on your site.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
            {leads.map((l) => (
              <li key={l.id} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
                <span className="break-all font-medium text-stone-900">{l.email}</span>
                <time className="text-stone-500" dateTime={l.createdAt.toISOString()}>
                  {l.createdAt.toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Recent messages
        </h2>
        <p className="mt-1 text-sm text-stone-600">Last {messages.length} rows stored for this assistant.</p>
        {messages.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">No chat history yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {chronological.map((m) => (
              <li
                key={m.id}
                className={`rounded-xl border px-3 py-2 text-sm break-words ${
                  m.role === "user"
                    ? "ml-0 border-stone-200 bg-stone-100 text-stone-900 sm:ml-4"
                    : "mr-0 border-teal-100 bg-teal-50/50 text-stone-800 sm:mr-4"
                }`}
              >
                <span className="text-xs font-semibold uppercase text-stone-500">
                  {m.role === "user" ? "Visitor" : "Assistant"}{" "}
                </span>
                <span className="whitespace-pre-wrap">{clip(m.content, 500)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
