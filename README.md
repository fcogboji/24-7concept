# faztino

Next.js app: train an AI assistant on site content, capture leads and booking requests, follow up by email or WhatsApp, manage conversations in a dashboard, handle Stripe billing, and embed the public `widget.js` visitor chat.

## What The App Does

Faztino is not just a generic chatbot. It is built to help appointment-led businesses turn website visitors into follow-up-ready leads.

The main flow is:

1. A business creates an assistant.
2. The assistant is trained from website pages, pasted content, and business notes.
3. The business embeds one script on its website.
4. Visitors chat with the assistant.
5. The assistant answers from the business context, captures lead details, and can help with booking requests.
6. The dashboard shows conversations, leads, urgency, summaries, and follow-up actions.

## Recent Product Additions

### Live Demo CTA

The landing page `View live demo` button now works like a real app demo.

- It scrolls to the demo section.
- It opens the embedded chat widget automatically.
- The widget shows the welcome message so visitors immediately see the product working.

Files:

- `src/components/demo-open-button.tsx`
- `src/app/(site)/page.tsx`
- `src/app/embed/chat/page.tsx`
- `public/widget.js`

### Lead Intelligence

The app now calculates a simple lead quality score from each conversation.

Scores:

- `Hot lead` — phone captured, booking intent, urgent timing, availability request, or clear follow-up intent.
- `Warm lead` — email captured, price question, service question, or general buying interest.
- `Cold lead` — light/general enquiry or dismissed lead.

It also shows signals such as:

- `Phone captured`
- `Email captured`
- `Booking intent`
- `Asked price`
- `Needs human`
- `General enquiry`

File:

- `src/lib/lead-intelligence.ts`

Visible in:

- Dashboard overview
- Leads page
- Conversation inbox
- Conversation detail page

### WhatsApp Follow-Up

The app now supports WhatsApp-assisted follow-up.

This is not full WhatsApp Business API automation. It creates a safe, simple WhatsApp deep link for the business owner.

When a lead has a phone number, the app can show a `WhatsApp` or `Reply on WhatsApp` button. Clicking it opens WhatsApp with a prefilled follow-up message.

Example message:

```text
Hi Sarah, thanks for chatting with Faztino. I saw you asked about Saturday availability. Are you still interested? I can help with the next step.
```

The WhatsApp button appears only when:

- The lead has a phone number.
- The phone number contains enough digits to create a WhatsApp link.

Visible in:

- Dashboard overview follow-up brief
- Leads page
- Conversation detail page

### Suggested Follow-Up Messages

Each conversation detail page now includes a suggested follow-up based on the visitor’s messages.

The app uses the conversation to produce a practical reply the business can send by email or WhatsApp.

Visible in:

- `src/app/(site)/dashboard/conversations/[sessionId]/page.tsx`
- `src/app/(site)/dashboard/conversations/[sessionId]/lead-actions.tsx`

### Daily Follow-Up Brief

The dashboard overview now includes a `Today’s follow-up brief`.

It shows:

- New leads from the last 24 hours.
- How many are hot.
- Short summaries.
- Quick links to view the chat.
- WhatsApp reply links when phone numbers are available.

Visible in:

- `src/app/(site)/dashboard/page.tsx`

### Lead Inbox Upgrade

The leads page now shows more than contact details.

It now includes:

- Hot/Warm/Cold badges.
- Lead status badges.
- Conversation summaries.
- WhatsApp quick links when possible.
- Links back to the full chat.

Visible in:

- `src/app/(site)/dashboard/leads/page.tsx`

### Conversation Inbox Upgrade

The conversation inbox now shows lead urgency and better summaries, so the owner can quickly decide which chats need attention.

Visible in:

- `src/app/(site)/dashboard/conversations/page.tsx`

### Conversation Detail Upgrade

The conversation detail page now acts like a mini sales brief.

It shows:

- Lead temperature.
- Lead signals.
- Contact details.
- Page URL.
- Conversation summary.
- Suggested reply.
- Email follow-up.
- WhatsApp follow-up when phone exists.
- Status updates such as `Contacted`, `WhatsApp sent`, and `Booked`.

Visible in:

- `src/app/(site)/dashboard/conversations/[sessionId]/page.tsx`
- `src/app/(site)/dashboard/conversations/[sessionId]/lead-actions.tsx`

### Industry Templates

New assistant creation now asks for business type.

Available templates:

- General business
- Dental clinic
- Salon or barber
- Aesthetics clinic
- Real estate
- Law firm
- Home services

The selected template preloads useful business instructions and safety boundaries into the assistant’s business information.

This helps new users get a better assistant without starting from a blank box.

Files:

- `src/lib/industry-templates.ts`
- `src/app/(site)/dashboard/bots/new/new-bot-form.tsx`
- `src/app/api/bots/route.ts`

### Landing Page Upgrade

The landing page copy now focuses on what the product really does:

- Website-trained replies.
- Lead capture.
- Booking requests.
- Dashboard follow-up.
- WhatsApp-ready replies.

It also includes a visible “hot lead” preview panel to show the kind of value the business owner gets.

Visible in:

- `src/app/(site)/page.tsx`

## Important Product Notes

### WhatsApp

The current WhatsApp feature is **assisted follow-up**, not automated WhatsApp chatbot messaging.

This is intentional because it is:

- Faster to ship.
- Easier for small businesses to understand.
- Safer with Meta/WhatsApp policy.
- Useful immediately without WhatsApp Business API setup.

Future full WhatsApp automation would require:

- WhatsApp Business Platform setup.
- Meta app/business verification.
- Webhook handling.
- Message template approval for outbound messages.
- Careful policy review.

### Lead Scoring

Lead scoring is currently rule-based. It looks for things like phone numbers, booking words, price questions, urgency, and human follow-up requests.

It does not require another AI call, so it is fast and cheap.

### Industry Templates

Templates are starter instructions. The business owner should still review and edit business information after creating an assistant.

## Setup

```bash
npm install
cp .env.example .env   # fill DATABASE_URL, Clerk, OpenAI, Stripe, etc.
npm run db:push
npm run db:seed        # optional — demo assistant
npm run dev
```

If **`Another next dev server is already running`** (Next.js 16 single-dev lock):

```bash
npm run dev:fresh      # frees ports 3000–3002, then starts dev
```

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run build` | Production build |
| `npm run check:env` | Verify local/dev required env vars are present |
| `npm run check:launch-env` | Verify production env vars use launch-safe values |
| `npm run launch:check` | Final paid-launch gate: production env check, lint, build |
| `npm run launch:check:embed` | Final paid-launch gate plus embed smoke test (app must be running) |
| `npm run verify:embed` | CORS + `/widget.js` smoke (app must be running) |

See `.env.example` for environment variables.
Use `.env.production.example` as the hosting-provider template for live production variables.

## Layout

- `src/app` — App Router pages and API routes  
- `public/widget.js` — customer embed script  

Agent / editor rules: `AGENTS.md` (and `CLAUDE.md` → `AGENTS.md`).
