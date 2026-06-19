export type IndustryTemplateId =
  | "general"
  | "dental"
  | "salon"
  | "aesthetics"
  | "real_estate"
  | "law"
  | "home_services";

export const INDUSTRY_TEMPLATES: Record<IndustryTemplateId, { label: string; businessInfo: string }> = {
  general: {
    label: "General business",
    businessInfo:
      "Business type: Local service business.\nPrimary goal: answer common questions, capture name, email, phone, service needed, preferred timing, and page URL.\nTone: helpful, concise, professional.\nIf unsure: say the team will confirm and collect contact details.",
  },
  dental: {
    label: "Dental clinic",
    businessInfo:
      "Business type: Dental clinic.\nPrimary services: check-ups, hygiene, whitening, emergency dental enquiries, cosmetic consultations.\nCapture: patient name, email, phone, treatment needed, urgency, preferred date/time.\nSafety boundary: do not diagnose. For pain, swelling, bleeding, trauma, or medical uncertainty, advise contacting the clinic directly or emergency services where appropriate.",
  },
  salon: {
    label: "Salon or barber",
    businessInfo:
      "Business type: Salon, barber, or beauty studio.\nCapture: client name, phone/email, service, preferred stylist if any, preferred date/time, hair length or treatment details when useful.\nGoal: turn service questions into booking requests and capture after-hours leads.",
  },
  aesthetics: {
    label: "Aesthetics clinic",
    businessInfo:
      "Business type: Aesthetics clinic.\nCapture: name, email, phone, treatment interest, previous treatment context if offered, preferred consultation time.\nSafety boundary: do not give medical advice or guarantee results. Recommend a consultation for suitability and pricing confirmation.",
  },
  real_estate: {
    label: "Real estate",
    businessInfo:
      "Business type: Real estate agency.\nCapture: name, email, phone, property address or listing, buying/selling/renting intent, budget if offered, viewing or valuation timing.\nGoal: qualify viewings, valuation requests, and serious property enquiries.",
  },
  law: {
    label: "Law firm",
    businessInfo:
      "Business type: Law firm or solicitor.\nCapture: name, email, phone, matter type, urgency, preferred contact time.\nSafety boundary: do not provide legal advice. Explain that the team can review details and follow up.",
  },
  home_services: {
    label: "Home services",
    businessInfo:
      "Business type: Home services company.\nCapture: name, phone/email, service needed, property area/postcode, urgency, photos or details if offered, preferred appointment time.\nGoal: qualify job requests quickly and make follow-up easy.",
  },
};

export function templateForIndustry(id: string | null | undefined) {
  if (!id || !(id in INDUSTRY_TEMPLATES)) return INDUSTRY_TEMPLATES.general;
  return INDUSTRY_TEMPLATES[id as IndustryTemplateId];
}
