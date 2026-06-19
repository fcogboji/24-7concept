# Public Readiness Audit

Date: 2026-06-05

Scope: file-by-file inventory plus launch-readiness review for paying users. Secret values from `.env` were not printed or copied here.

## Verdict

The launch blockers found in the first pass have been fixed. `npm run lint` is clean, and a network-enabled `npm run build` passes.

The app is technically ready to deploy for paying users once the production host has live environment values: database URLs, Clerk, OpenAI, Stripe, Stripe webhook secret, Upstash Redis, Resend sender/API key, health secret, and `SECRET_ENCRYPTION_KEY`.

`npm run check:env` validates local/dev coverage. `npm run check:launch-env` validates production-grade values. `npm run launch:check` is the final paid-launch gate and should pass in the deployment environment before accepting paid traffic.

## Fixed Launch Issues

1. Fixed all ESLint errors and warnings.
   - Removed synchronous state updates from route-change effects.
   - Renamed the Prisma helper that looked like a React hook.
   - Fixed unused variables, hook dependencies, and the dashboard avatar image warning.

2. Added `SECRET_ENCRYPTION_KEY` to local `.env`.
   - Required by `src/lib/secret-cipher.ts` for encrypted customer webhook secrets.
   - Set the same value in production before customers create webhook configs.

3. Reconciled pricing copy and backend limits.
   - Starter is now `500` monthly chat messages.
   - Pro is now `5,000` monthly chat messages.

4. Made Paystack optional instead of publicly promised when unconfigured.
   - If Paystack env vars are absent, the homepage prices in USD and checkout uses Stripe.
   - `.env.example` now documents optional Paystack keys for NGN billing.

5. Replaced the real-looking example health secret with a placeholder.

6. Added root `metadataBase`.
   - The build no longer falls back to `http://localhost:3000` for generated metadata URLs.

7. Tightened marketing/legal copy to avoid overpromising unavailable native calendar/CRM integrations.

## Remaining Operational Checks

- Confirm production `NEXT_PUBLIC_APP_URL` is the canonical public origin.
- Run `npm run launch:check` in production/CI. It currently fails against local `.env` because local uses localhost, Resend sandbox sender, and Clerk test keys.
- Confirm Stripe webhook endpoint is configured for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
- Confirm Upstash is configured in production; production rate limiting intentionally refuses protected traffic without it.
- Confirm Resend uses a verified domain sender, not the sandbox sender.
- Decide whether Paystack should be enabled. If yes, add the Paystack env vars and update terms/payment copy as needed.
- Run a real checkout/webhook smoke test against the production database before opening paid acquisition.

## Verification Run

- `git status --short`: clean before this audit file was added.
- Static import scan: no obvious unreferenced `src` helper/component files found. App Router files are treated as live by path.
- `npm run lint`: passed.
- `npm run check:env`: passed.
- `npm run check:launch-env`: correctly fails for local dev/sandbox values; should pass in production once live values are installed.
- `npm run build`: passed after network-enabled rerun.
- `npm run verify:embed`: passed against the built app on `localhost:3000`.

## Cleanup Candidates

These are not confirmed useless, but they are worth a product decision:

- `src/app/api/stripe/checkout/route.ts` and `src/app/api/paystack/checkout/route.ts`: provider-specific checkout routes exist alongside unified `src/app/api/billing/checkout/route.ts`. Keep if older buttons or integrations call them; otherwise consolidate.
- `src/app/embed/widget.js/route.ts`, `src/app/embed/widget-js/route.ts`, `public/widget.js`, and `/api/embed` rewrite: multiple legacy/current widget entry points. Keep if old customer snippets exist; otherwise document the canonical one and remove legacy paths later.
- `src/lib/paystack.ts`, `src/lib/paystack-env.ts`, `src/app/api/paystack/*`: only needed if NGN/Paystack billing is supported.
- `scripts/purge-non-admin-users.ts`: admin maintenance script, not app runtime. Keep only if you actually use it.
- `CLAUDE.md`: duplicated agent/editor guidance. Keep if Claude is used; otherwise `AGENTS.md` is enough.

## File Inventory

### Root and Config

| File | Purpose | Keep? |
|---|---|---|
| `AGENTS.md` | Agent instructions, including Next 16 docs warning. | Yes |
| `CLAUDE.md` | Claude/editor instruction shim. | Optional |
| `README.md` | Setup, scripts, and app overview. | Yes |
| `.env` | Local secrets/config; not committed. Includes `SECRET_ENCRYPTION_KEY`. | Yes |
| `.env.example` | Environment template and deployment notes with placeholders. | Yes |
| `.gitignore` | Excludes env, Clerk config, build output, deps, TypeScript cache. | Yes |
| `package.json` | Dependencies and scripts for Next, Prisma, billing, OpenAI, Sentry. | Yes |
| `package-lock.json` | Locked npm dependency tree. | Yes |
| `next.config.ts` | Rewrites, headers, CSP, embed/widget CORS-safe headers, external packages. | Yes |
| `eslint.config.mjs` | Next core-web-vitals + TypeScript lint config. | Yes |
| `tsconfig.json` | Strict TypeScript config and `@/*` alias. | Yes |
| `postcss.config.mjs` | Tailwind/PostCSS setup. | Yes |
| `next-env.d.ts` | Generated Next TypeScript types; ignored by git. | Generated |
| `tsconfig.tsbuildinfo` | TypeScript incremental cache; ignored by git. | Generated |

### Prisma and Scripts

| File | Purpose | Keep? |
|---|---|---|
| `prisma/schema.prisma` | Database schema for users, bots, sources, messages, leads, bookings, audits, webhook idempotency. | Yes |
| `prisma/seed.ts` | Seeds demo assistant/content. | Yes if demo needed |
| `prisma/manual-migrations/0001_subscription_status_backfill.sql` | Backfills legacy paid users with subscription status. | Yes |
| `scripts/free-dev-ports.mjs` | Frees local dev ports 3000-3002. | Optional dev utility |
| `scripts/verify-embed.mjs` | Smoke tests widget serving/CORS when app runs. | Yes |
| `scripts/purge-non-admin-users.ts` | Maintenance cleanup for non-admin users. | Optional/admin only |

### Public Assets

| File | Purpose | Keep? |
|---|---|---|
| `public/widget.js` | Customer embed script that loads iframe chat widget. | Yes |
| `public/sw.js` | Service worker asset. | Yes if SW is desired |
| `public/logo.png` | Brand logo image. | Yes |
| `public/robot-support-call.png` | Marketing hero/demo visual. | Yes |
| `public/robot-chat-replies.png` | Marketing hero/demo visual. | Yes |
| `public/robot-typing-laptop.png` | Marketing hero/demo visual. | Yes |

### App Shell, SEO, and Global Files

| File | Purpose | Keep? |
|---|---|---|
| `src/app/layout.tsx` | Minimal root layout for all routes; embed avoids Clerk/font overhead. | Yes |
| `src/app/(site)/layout.tsx` | Main Clerk-wrapped site layout, Google fonts, viewport, metadata. | Yes |
| `src/app/globals.css` | Global Tailwind/styles. | Yes |
| `src/app/providers.tsx` | Client providers wrapper. | Yes |
| `src/app/error.tsx` | Route-level error boundary. | Yes |
| `src/app/global-error.tsx` | Global error boundary. | Yes |
| `src/app/not-found.tsx` | 404 page. | Yes |
| `src/app/robots.ts` | Generates `robots.txt`. | Yes |
| `src/app/sitemap.ts` | Generates sitemap. | Yes |
| `src/app/icon.tsx` | Dynamic favicon/icon. | Yes |
| `src/app/apple-icon.tsx` | Dynamic Apple touch icon. | Yes |
| `src/app/opengraph-image.tsx` | Dynamic OG image. | Yes |
| `src/proxy.ts` | Clerk auth middleware/proxy and public route allowlist. | Yes |
| `src/instrumentation.ts` | Server instrumentation/Sentry error hook. | Yes if Sentry used |
| `src/instrumentation-client.ts` | Client instrumentation hook. | Yes if Sentry used |

### Marketing and Auth Pages

| File | Purpose | Keep? |
|---|---|---|
| `src/app/(site)/page.tsx` | Marketing homepage, demo widget, pricing, value sections. | Yes |
| `src/app/(site)/privacy/page.tsx` | Privacy policy. | Yes |
| `src/app/(site)/terms/page.tsx` | Terms page with provider-neutral payment wording. | Yes |
| `src/app/(site)/login/[[...rest]]/page.tsx` | Clerk sign-in page. | Yes |
| `src/app/(site)/register/[[...rest]]/page.tsx` | Clerk sign-up page. | Yes |
| `src/app/(site)/forgot-password/page.tsx` | Forgot-password page. | Yes |
| `src/app/(site)/reset-password/page.tsx` | Reset-password page. | Yes |
| `src/app/(site)/verify-email/page.tsx` | Email verification helper page. | Yes |

### Admin Pages

| File | Purpose | Keep? |
|---|---|---|
| `src/app/(site)/admin/(public)/sign-in/[[...sign-in]]/page.tsx` | Admin Clerk sign-in. | Yes |
| `src/app/(site)/admin/(public)/unauthorized/page.tsx` | Admin unauthorized page. | Yes |
| `src/app/(site)/admin/(dashboard)/layout.tsx` | Admin auth layout, dynamic rendering. | Yes |
| `src/app/(site)/admin/(dashboard)/page.tsx` | Admin overview dashboard. | Yes |
| `src/app/(site)/admin/(dashboard)/analytics/page.tsx` | Admin analytics. | Yes |
| `src/app/(site)/admin/(dashboard)/users/page.tsx` | Admin user list. | Yes |
| `src/app/(site)/admin/(dashboard)/users/[id]/page.tsx` | Admin user detail. | Yes |
| `src/app/(site)/admin/(dashboard)/bots/page.tsx` | Admin bot list. | Yes |
| `src/app/(site)/admin/(dashboard)/messages/page.tsx` | Admin message list. | Yes |
| `src/app/(site)/admin/(dashboard)/leads/page.tsx` | Admin lead list. | Yes |
| `src/app/(site)/admin/(dashboard)/activity/page.tsx` | Audit log page. | Yes |
| `src/app/(site)/admin/(dashboard)/system/page.tsx` | Environment/config status page without secret values. | Yes |

### Dashboard Pages and Client Panels

| File | Purpose | Keep? |
|---|---|---|
| `src/app/(site)/dashboard/layout.tsx` | Authenticated customer dashboard layout and subscription gate. | Yes |
| `src/app/(site)/dashboard/page.tsx` | Dashboard overview, subscription sync, bot/message/lead summaries. | Yes |
| `src/app/(site)/dashboard/analytics/page.tsx` | Customer analytics. | Yes |
| `src/app/(site)/dashboard/leads/page.tsx` | Customer lead list. | Yes |
| `src/app/(site)/dashboard/conversations/page.tsx` | Conversation/session list. | Yes |
| `src/app/(site)/dashboard/conversations/[sessionId]/page.tsx` | Conversation detail. | Yes |
| `src/app/(site)/dashboard/conversations/[sessionId]/lead-actions.tsx` | Client lead actions from a conversation. | Yes |
| `src/app/(site)/dashboard/appointments/page.tsx` | Customer appointments page. | Yes |
| `src/app/(site)/dashboard/appointments/appointments-list.tsx` | Client appointment list/status updates. | Yes |
| `src/app/(site)/dashboard/webhooks/page.tsx` | Customer webhook settings page. | Yes |
| `src/app/(site)/dashboard/webhooks/webhook-manager.tsx` | Client webhook CRUD UI. | Yes |
| `src/app/(site)/dashboard/account/[[...rest]]/page.tsx` | Clerk account/user profile page. | Yes |
| `src/app/(site)/dashboard/checkout-button.tsx` | Client checkout trigger. | Yes |
| `src/app/(site)/dashboard/manage-billing-button.tsx` | Stripe billing portal trigger. | Yes |
| `src/app/(site)/dashboard/sign-out-button.tsx` | Client sign-out button. | Yes |
| `src/app/(site)/dashboard/sync-plan-button.tsx` | Manual Stripe subscription sync. | Yes |
| `src/app/(site)/dashboard/subscription-wall.tsx` | Subscription-required UI. | Yes |
| `src/app/(site)/dashboard/subscription-wall-auto-sync.tsx` | Auto-syncs plan after Stripe redirect. | Yes |
| `src/app/(site)/dashboard/subscription-wall-sign-out.tsx` | Sign-out inside subscription wall. | Yes |
| `src/app/(site)/dashboard/bots/new/page.tsx` | New bot page. | Yes |
| `src/app/(site)/dashboard/bots/new/new-bot-form.tsx` | New bot form client component. | Yes |
| `src/app/(site)/dashboard/bots/[id]/page.tsx` | Bot overview/detail page. | Yes |
| `src/app/(site)/dashboard/bots/[id]/knowledge/page.tsx` | Bot knowledge page. | Yes |
| `src/app/(site)/dashboard/bots/[id]/appearance/page.tsx` | Bot appearance page. | Yes |
| `src/app/(site)/dashboard/bots/[id]/integration/page.tsx` | Bot integration/embed page. | Yes |
| `src/app/(site)/dashboard/bots/[id]/booking/page.tsx` | Bot booking config page. | Yes |
| `src/app/(site)/dashboard/bots/[id]/booking/services/page.tsx` | Booking services page. | Yes |
| `src/app/(site)/dashboard/bots/[id]/bot-activity.tsx` | Bot activity widget. | Yes |
| `src/app/(site)/dashboard/bots/[id]/bot-appearance-panel.tsx` | Bot appearance editor. | Yes |
| `src/app/(site)/dashboard/bots/[id]/bot-integration-panel.tsx` | Embed/integration controls. | Yes |
| `src/app/(site)/dashboard/bots/[id]/bot-knowledge-panel.tsx` | Training/business-info controls. | Yes |
| `src/app/(site)/dashboard/bots/[id]/bot-widget-setup-grid.tsx` | Widget setup/snippet display. | Yes |
| `src/app/(site)/dashboard/bots/[id]/booking/booking-config-panel.tsx` | Booking hours/settings editor. | Yes |
| `src/app/(site)/dashboard/bots/[id]/booking/services/services-panel.tsx` | Booking service CRUD UI. | Yes |

### Embed Routes

| File | Purpose | Keep? |
|---|---|---|
| `src/app/embed/chat/layout.tsx` | Minimal metadata/viewport for iframe chat. | Yes |
| `src/app/embed/chat/page.tsx` | Public iframe chat UI. | Yes |
| `src/app/embed/widget.js/route.ts` | Dynamic widget script route using shared helper. | Keep if canonical/legacy |
| `src/app/embed/widget-js/route.ts` | Alternate widget JS route. | Keep if legacy |

### API Routes

| File | Purpose | Keep? |
|---|---|---|
| `src/app/api/health/route.ts` | Health check, optional bearer/token secret, DB check. | Yes |
| `src/app/api/session/route.ts` | Public widget/session probe route. | Yes |
| `src/app/api/chat/route.ts` | Public chat endpoint: CORS, rate limits, quota, RAG, OpenAI streaming, tools. | Yes |
| `src/app/api/leads/route.ts` | Public lead capture endpoint. | Yes |
| `src/app/api/leads/[id]/route.ts` | Lead update endpoint. | Yes |
| `src/app/api/leads/[id]/follow-up/route.ts` | Lead follow-up/action endpoint. | Yes |
| `src/app/api/leads/export/route.ts` | Lead CSV export. | Yes |
| `src/app/api/bots/route.ts` | Bot list/create. | Yes |
| `src/app/api/bots/[id]/route.ts` | Bot update/delete. | Yes |
| `src/app/api/bots/[id]/train/route.ts` | Website crawl/training. | Yes |
| `src/app/api/bots/[id]/train-text/route.ts` | Manual text training. | Yes |
| `src/app/api/bots/[id]/auto-learn/route.ts` | Auto-learning/training route. | Yes |
| `src/app/api/bots/[id]/suggestions/route.ts` | Public bot suggestions endpoint. | Yes |
| `src/app/api/bots/[id]/appointments/route.ts` | Appointment list for bot. | Yes |
| `src/app/api/bots/[id]/appointments/[apptId]/route.ts` | Appointment status/update. | Yes |
| `src/app/api/bots/[id]/booking/route.ts` | Booking config get/update. | Yes |
| `src/app/api/bots/[id]/booking/services/route.ts` | Booking service list/create. | Yes |
| `src/app/api/bots/[id]/booking/services/[serviceId]/route.ts` | Booking service update/delete. | Yes |
| `src/app/api/bots/[id]/booking/blocked-dates/route.ts` | Blocked date list/create. | Yes |
| `src/app/api/bots/[id]/booking/blocked-dates/[dateId]/route.ts` | Blocked date delete. | Yes |
| `src/app/api/billing/checkout/route.ts` | Unified checkout; routes NG users to Paystack if enabled, otherwise Stripe. | Yes |
| `src/app/api/stripe/checkout/route.ts` | Stripe-only checkout endpoint. | Optional legacy |
| `src/app/api/stripe/portal/route.ts` | Stripe billing portal. | Yes |
| `src/app/api/stripe/sync-billing/route.ts` | Manual Stripe plan recovery by email. | Yes |
| `src/app/api/stripe/webhook/route.ts` | Stripe webhook with idempotency and subscription state updates. | Yes |
| `src/app/api/paystack/checkout/route.ts` | Paystack-only checkout endpoint. | Optional if Paystack disabled |
| `src/app/api/paystack/webhook/route.ts` | Paystack webhook with signature verification/idempotency. | Optional if Paystack disabled |
| `src/app/api/webhooks-config/route.ts` | Customer webhook config list/create. | Yes |
| `src/app/api/webhooks-config/[id]/route.ts` | Customer webhook config delete. | Yes |
| `src/app/api/admin/users/[id]/verify-email/route.ts` | Admin action to mark email verified. | Yes |

### Components and Hooks

| File | Purpose | Keep? |
|---|---|---|
| `src/components/landing-hero-background.tsx` | Homepage hero background. | Yes |
| `src/components/cookie-consent.tsx` | Cookie consent banner. | Yes |
| `src/components/marketing-header.tsx` | Marketing nav/header. | Yes |
| `src/components/hero-robot-marquee.tsx` | Animated hero image marquee. | Yes |
| `src/components/demo-widget.tsx` | Loads demo widget script. | Yes |
| `src/components/pricing-section.tsx` | Pricing cards and annual/monthly toggle. | Yes, reconcile limits |
| `src/components/legal-footer-links.tsx` | Privacy/terms footer links. | Yes |
| `src/components/service-worker-register.tsx` | Registers service worker. | Yes if SW desired |
| `src/components/brand-logo.tsx` | Reusable brand/logo component. | Yes |
| `src/components/dashboard/dashboard-sidebar.tsx` | Customer dashboard navigation. | Yes |
| `src/components/dashboard/dashboard-shell.tsx` | Customer dashboard shell/mobile nav. | Yes |
| `src/components/dashboard/dashboard-page-header.tsx` | Shared dashboard page heading. | Yes |
| `src/components/dashboard/dashboard-help-fab.tsx` | Help floating action button. | Yes |
| `src/components/dashboard/dashboard-charts.tsx` | Dashboard chart components. | Yes |
| `src/components/admin/admin-sidebar.tsx` | Admin navigation/mobile drawer. | Yes |
| `src/components/admin/admin-pagination.tsx` | Admin pagination UI. | Yes |
| `src/components/admin/mark-email-verified-button.tsx` | Admin email verification action button. | Yes |
| `src/hooks/use-clerk-admin-nav.ts` | Detects admin navigation context for Clerk/admin UI behavior. | Yes |

### Libraries

| File | Purpose | Keep? |
|---|---|---|
| `src/lib/prisma.ts` | Prisma client creation, Neon adapter, WS setup. | Yes |
| `src/lib/ensure-ws-no-bufferutil.ts` | Prevents optional `ws` native dependency bundling issues. | Yes |
| `src/lib/openai.ts` | OpenAI client/model helpers. | Yes |
| `src/lib/embeddings.ts` | Creates OpenAI embeddings. | Yes |
| `src/lib/retrieve.ts` | Finds relevant source chunks by embedding similarity. | Yes |
| `src/lib/similarity.ts` | Cosine similarity helper. | Yes |
| `src/lib/chunk.ts` | Splits crawled/training text into chunks. | Yes |
| `src/lib/crawler.ts` | Fetch-based crawler and training extraction. | Yes |
| `src/lib/crawler-rendered.ts` | Headless browser rendered crawl fallback. | Yes |
| `src/lib/url-safety.ts` | SSRF safety checks for user-supplied training URLs. | Yes |
| `src/lib/rate-limit.ts` | Upstash/memory rate limit helpers; production requires Upstash. | Yes |
| `src/lib/request-ip.ts` | Shared client IP extraction. | Yes |
| `src/lib/widget-cors.ts` | CORS policy for public widget APIs. | Yes |
| `src/lib/chat-form.ts` | Encodes/parses booking forms inside chat streams. | Yes |
| `src/lib/booking-tools.ts` | OpenAI tool definitions/handlers for booking. | Yes |
| `src/lib/engagement-tools.ts` | OpenAI tool definitions/handlers for leads/human escalation. | Yes |
| `src/lib/booking-availability.ts` | Computes available booking slots/timezone conversions. | Yes |
| `src/lib/booking-emails.ts` | Booking/lead notification emails. | Yes |
| `src/lib/email.ts` | Resend email configuration and send helper. | Yes |
| `src/lib/webhooks.ts` | Outbound customer webhook signing/firing. | Yes |
| `src/lib/secret-cipher.ts` | AES-GCM encryption for stored webhook secrets. | Yes |
| `src/lib/audit.ts` | Audit log writer. | Yes |
| `src/lib/admin-auth.ts` | Clerk admin authorization helpers. | Yes |
| `src/lib/admin-stats.ts` | Admin overview statistics. | Yes |
| `src/lib/admin-pagination.ts` | Admin pagination constants/helpers. | Yes |
| `src/lib/clerk-app-user.ts` | Creates/loads local app user from Clerk user. | Yes |
| `src/lib/pricing.ts` | Pricing tiers, currencies, Paystack NGN amounts. | Yes |
| `src/lib/plan.ts` | Subscription checks, bot limits, message quotas. | Yes, reconcile pricing |
| `src/lib/checkout.ts` | Stripe/Paystack checkout creation. | Yes |
| `src/lib/stripe-env.ts` | Stripe env lookup and aliases. | Yes |
| `src/lib/stripe-sync-user-plan.ts` | Syncs app user plan from Stripe sessions/subscriptions. | Yes |
| `src/lib/paystack.ts` | Paystack API/signature helpers. | Optional if Paystack disabled |
| `src/lib/paystack-env.ts` | Paystack env helpers. | Optional if Paystack disabled |
| `src/lib/public-app-url.ts` | Public origin and redirect URL helpers. | Yes |
| `src/lib/safe-redirect.ts` | Prevents unsafe app redirects. | Yes |
| `src/lib/embed-widget-script-route.ts` | Shared dynamic widget JS route response. | Yes |
| `src/lib/widget-embed-snippet.ts` | Builds customer embed snippet/URLs. | Yes |
| `src/lib/logger.ts` | Structured logging and optional Sentry forwarding. | Yes |
