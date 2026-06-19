export type LeadTemperature = "hot" | "warm" | "cold";

export type LeadSignal = {
  label: string;
  tone: "red" | "amber" | "emerald" | "gray";
};

type MessageLike = {
  role: string;
  content: string;
  createdAt?: Date;
};

type LeadLike = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
};

const HOT_PATTERNS = [
  /\b(book|booking|appointment|available|availability|schedule|reserve|today|tomorrow|this week|asap|urgent)\b/i,
  /\b(call me|phone me|ring me|contact me)\b/i,
];

const WARM_PATTERNS = [
  /\b(price|pricing|cost|quote|fee|how much|service|treatment|viewing|valuation|consultation)\b/i,
  /\b(interested|need|looking for|want to|can you)\b/i,
];

const HUMAN_PATTERNS = [
  /\b(human|person|someone|call|complaint|refund|cancel|angry|urgent)\b/i,
];

export function leadTemperature(lead: LeadLike | null, messages: MessageLike[]): LeadTemperature {
  const text = messages.map((m) => m.content).join("\n");
  if (lead?.status === "dismissed") return "cold";
  if (lead?.phone || HOT_PATTERNS.some((p) => p.test(text))) return "hot";
  if (lead?.email || WARM_PATTERNS.some((p) => p.test(text))) return "warm";
  return "cold";
}

export function leadTemperatureLabel(temp: LeadTemperature): string {
  return temp === "hot" ? "Hot lead" : temp === "warm" ? "Warm lead" : "Cold lead";
}

export function leadTemperatureClass(temp: LeadTemperature): string {
  switch (temp) {
    case "hot":
      return "bg-red-100 text-red-800";
    case "warm":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function leadSignals(lead: LeadLike | null, messages: MessageLike[]): LeadSignal[] {
  const text = messages.map((m) => m.content).join("\n");
  const signals: LeadSignal[] = [];
  if (lead?.phone) signals.push({ label: "Phone captured", tone: "emerald" });
  if (lead?.email) signals.push({ label: "Email captured", tone: "emerald" });
  if (HOT_PATTERNS.some((p) => p.test(text))) signals.push({ label: "Booking intent", tone: "red" });
  if (/\b(price|cost|quote|fee|how much)\b/i.test(text)) signals.push({ label: "Asked price", tone: "amber" });
  if (HUMAN_PATTERNS.some((p) => p.test(text))) signals.push({ label: "Needs human", tone: "red" });
  if (signals.length === 0) signals.push({ label: "General enquiry", tone: "gray" });
  return signals.slice(0, 4);
}

export function signalClass(tone: LeadSignal["tone"]): string {
  switch (tone) {
    case "red":
      return "bg-red-50 text-red-700";
    case "amber":
      return "bg-amber-50 text-amber-700";
    case "emerald":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function summarizeConversation(messages: MessageLike[]): string {
  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content.trim()).filter(Boolean);
  if (userMessages.length === 0) return "No visitor question captured yet.";
  const combined = userMessages.join(" ");
  const first = userMessages[0];
  const hasBooking = HOT_PATTERNS.some((p) => p.test(combined));
  const hasPrice = /\b(price|cost|quote|fee|how much)\b/i.test(combined);
  const parts = [clip(first, 120)];
  if (hasBooking) parts.push("Visitor showed booking intent.");
  if (hasPrice) parts.push("Price or quote question detected.");
  return parts.join(" ");
}

export function suggestedFollowUp(lead: LeadLike | null, botName: string, messages: MessageLike[]): string {
  const name = lead?.name?.trim();
  const summary = summarizeConversation(messages);
  return [
    `Hi${name ? ` ${name}` : ""}, thanks for chatting with ${botName}.`,
    `I saw you asked about: ${summary}`,
    "Are you still interested? I can help with the next step.",
  ].join(" ");
}

export function whatsappHref(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 7) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function clip(value: string, max: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}
