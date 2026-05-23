/** Fields the assistant can request via `request_booking_details`. */
export type BookingFormFieldId =
  | "name"
  | "email"
  | "phone"
  | "date"
  | "time"
  | "service";

export type BookingFormRequest = {
  fields: BookingFormFieldId[];
  prompt?: string;
};

export const BOOKING_FORM_FIELD_META: Record<
  BookingFormFieldId,
  { label: string; inputType: string; placeholder: string; required: boolean; autoComplete?: string }
> = {
  name: { label: "Full name", inputType: "text", placeholder: "Your name", required: true, autoComplete: "name" },
  email: {
    label: "Email",
    inputType: "email",
    placeholder: "you@example.com",
    required: true,
    autoComplete: "email",
  },
  phone: {
    label: "Phone",
    inputType: "tel",
    placeholder: "Phone number",
    required: false,
    autoComplete: "tel",
  },
  date: { label: "Date", inputType: "date", placeholder: "", required: true },
  time: { label: "Time", inputType: "time", placeholder: "", required: true },
  service: { label: "Service", inputType: "text", placeholder: "Which service?", required: false },
};

const ALLOWED = new Set<string>(Object.keys(BOOKING_FORM_FIELD_META));

/** Marker appended once at end of streamed chat replies (stripped before display). */
export const CHAT_FORM_STREAM_MARKER = "\f\faztino-form:";

export function normalizeBookingFormFields(raw: unknown): BookingFormFieldId[] {
  if (!Array.isArray(raw)) return [];
  const out: BookingFormFieldId[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const key = item.trim().toLowerCase();
    if (ALLOWED.has(key) && !out.includes(key as BookingFormFieldId)) {
      out.push(key as BookingFormFieldId);
    }
  }
  return out;
}

export function encodeBookingFormForStream(form: BookingFormRequest): string {
  return CHAT_FORM_STREAM_MARKER + JSON.stringify(form);
}

export function splitChatStreamWithForm(fullText: string): {
  displayText: string;
  form: BookingFormRequest | null;
} {
  const idx = fullText.indexOf(CHAT_FORM_STREAM_MARKER);
  if (idx === -1) return { displayText: fullText, form: null };
  const displayText = fullText.slice(0, idx);
  try {
    const parsed = JSON.parse(fullText.slice(idx + CHAT_FORM_STREAM_MARKER.length)) as BookingFormRequest;
    const fields = normalizeBookingFormFields(parsed.fields);
    if (fields.length === 0) return { displayText, form: null };
    return {
      displayText,
      form: {
        fields,
        prompt: typeof parsed.prompt === "string" ? parsed.prompt.trim() : undefined,
      },
    };
  } catch {
    return { displayText, form: null };
  }
}

/** Builds a user message the model can use to call create_appointment / capture_lead. */
export function formatBookingFormSubmission(
  values: Partial<Record<BookingFormFieldId, string>>,
): string {
  const lines: string[] = ["Here are my booking details:"];
  for (const [id, meta] of Object.entries(BOOKING_FORM_FIELD_META)) {
    const v = values[id as BookingFormFieldId]?.trim();
    if (v) lines.push(`- ${meta.label}: ${v}`);
  }
  return lines.join("\n");
}
