# Security & Production Readiness Audit Report
**Date:** 2026-07-25
**Application:** Faztino (SaaS Chatbot Platform)

## Executive Summary
This audit identified **CRITICAL** security vulnerabilities that must be resolved before launching to 100k+ paying users. The application has good foundations (rate limiting, CORS, CSP headers, SSRF protection) but has several high-risk issues related to secrets management, dependencies, and production hardening.

---

## CRITICAL Issues (Fix Immediately)

### 1. **EXPOSED SECRETS IN VERSION CONTROL** 🔴 CRITICAL
**Risk:** Database credentials, API keys, and encryption keys are committed in `.env`
**Impact:** Complete system compromise if repository is exposed
**Files:** `.env` (lines 2-74)

**Exposed Secrets:**
- Database connection strings with credentials
- OpenAI API key (sk-proj-...)
- Stripe secret keys
- Clerk secret keys
- Upstash Redis tokens
- Encryption keys (SECRET_ENCRYPTION_KEY, VAPID keys)
- Health check secrets

**Required Actions:**
1. Immediately revoke ALL exposed API keys/secrets
2. Generate new credentials from each provider
3. Move `.env` to `.env.example` with placeholder values
4. Add `.env` to `.gitignore` (verify it's already there)
5. Use environment variables in production (Vercel, Railway, etc.)
6. Audit git history and remove secrets from all commits (BFG Repo-Cleaner)

---

### 2. **HIGH SEVERITY NPM VULNERABILITIES** 🔴 CRITICAL
**Risk:** Known security vulnerabilities in production dependencies
**Impact:** DoS, SSRF, XSS, information disclosure

**Vulnerabilities Found:**
- **Next.js** (16.2.10): 9 high severity issues
  - Middleware/Proxy bypass in App Router with Turbopack
  - DoS in Server Actions
  - SSRF in Server Actions on custom servers
  - Cache confusion attacks
  - Unauthenticated disclosure of Server Function endpoints
  - SVG DoS in Image Optimization API

- **PostCSS** (≤8.5.17): 3 high severity issues
  - XSS via unescaped </style> in CSS output
  - Arbitrary file read via sourceMappingURL
  - Path traversal in source map loading

- **Sharp** (<0.35.0): High severity
  - Inherited libvips CVE vulnerabilities

- **brace-expansion** (≤5.0.7): High severity
  - DoS via unbounded expansion (OOM crash)

**Required Actions:**
```bash
npm audit fix --force
npm update next@latest
npm update sharp@latest
```

---

### 3. **PRODUCTION KEYS NOT CONFIGURED** 🔴 CRITICAL
**Risk:** Using TEST Stripe keys in `.env`
**Impact:** Payments will fail in production, revenue loss
**Files:** `.env` (lines 23-31)

**Current State:**
```
STRIPE_SECRET_KEY="sk_test_..." # TEST MODE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # TEST MODE
```

**Required Actions:**
1. Obtain production Stripe keys from https://dashboard.stripe.com/apikeys
2. Set in production environment (NOT in .env file)
3. Update webhook endpoints in Stripe dashboard for production domain
4. Test production webhooks with Stripe CLI

---

### 4. **UNSAFE RATE LIMITING IN PRODUCTION** 🔴 CRITICAL
**Risk:** Production will BLOCK all requests if Upstash is not configured
**Impact:** Complete service outage
**Files:** `src/lib/rate-limit.ts` (lines 22-26)

**Current Code:**
```typescript
function assertDistributedLimiterInProd(): { ok: true } | { ok: false; retryAfter: number } | null {
  if (process.env.NODE_ENV !== "production") return null;
  if (isUpstashConfigured()) return null;
  return { ok: false, retryAfter: 60 }; // BLOCKS ALL REQUESTS!
}
```

**Required Actions:**
1. Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in production
2. Add startup validation to fail fast if missing
3. Consider fallback strategy or circuit breaker

---

### 5. **CALENDAR TOKENS STORED UNENCRYPTED** 🔴 CRITICAL
**Risk:** Google/Microsoft OAuth tokens stored in plaintext
**Impact:** Account takeover, calendar access, data breach
**Files:** `prisma/schema.prisma` (lines 257-278)

**Current Schema:**
```prisma
model CalendarConnection {
  accessToken       String        @db.Text // ⚠️ PLAINTEXT
  refreshToken      String?       @db.Text // ⚠️ PLAINTEXT
}
```

**Required Actions:**
1. Use `secret-cipher.ts` to encrypt/decrypt tokens
2. Create migration to encrypt existing tokens
3. Update all read/write operations in calendar sync code

---

## HIGH Priority Issues (Fix Before Launch)

### 6. **MISSING ENVIRONMENT VALIDATION**
**Risk:** Silent failures in production due to missing env vars
**Files:** Multiple API routes

**Required Actions:**
1. Create `src/lib/env-validation.ts` using Zod
2. Validate all required env vars at startup
3. Fail fast with clear error messages

---

### 7. **INSUFFICIENT INPUT VALIDATION**
**Risk:** SQL injection, XSS, DoS via malformed inputs
**Files:** Various API routes

**Missing Validations:**
- Bot name/description length limits
- URL validation in booking/webhook configs
- Email format validation
- Phone number validation
- Sanitization of user-generated content in chat

**Required Actions:**
1. Add Zod schemas for all API inputs
2. Sanitize HTML/XSS in user content
3. Add length limits to all text fields

---

### 8. **NO DATABASE CONNECTION POOLING CONFIGURED**
**Risk:** Connection exhaustion at scale (100k users)
**Impact:** Database timeouts, service degradation
**Files:** `src/lib/prisma.ts`

**Required Actions:**
1. Configure Prisma connection pool:
```typescript
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
  connection_limit = 20 // Adjust based on plan
  pool_timeout = 20
}
```
2. Use Neon serverless with `@prisma/adapter-neon` (already configured)
3. Monitor connection usage

---

### 9. **MISSING DATABASE INDEXES**
**Risk:** Slow queries at scale
**Files:** `prisma/schema.prisma`

**Needed Indexes:**
- Message: `@@index([botId, sessionId, createdAt])`
- Lead: `@@index([status, createdAt])`
- AuditLog: Add cleanup job for old entries

---

### 10. **NO BACKUP/DISASTER RECOVERY PLAN**
**Risk:** Data loss
**Required Actions:**
1. Enable Neon point-in-time recovery
2. Set up automated daily backups
3. Test restore procedures
4. Document recovery playbook

---

## MEDIUM Priority Issues

### 11. **SENTRY CONFIGURATION INCOMPLETE**
- Verify Sentry DSN is set in production
- Configure sample rate for production
- Set up performance monitoring
- Configure user context (exclude PII)

### 12. **MISSING RATE LIMITS ON ADMIN ROUTES**
- Admin panel has no rate limiting
- Risk: Brute force attacks on admin login
- Add `rateLimitAuth` to admin endpoints

### 13. **WEBHOOK SECRET ROTATION NOT DOCUMENTED**
- No process for rotating webhook secrets
- Document rotation procedure

### 14. **NO GRACEFUL DEGRADATION FOR OPENAI OUTAGES**
- Chat fails completely if OpenAI is down
- Add fallback messaging
- Queue messages for retry

### 15. **CORS ALLOWS ALL ORIGINS BY DEFAULT**
**Files:** `src/lib/widget-cors.ts`
- Default allows any origin (`*`)
- Set `WIDGET_ALLOWED_ORIGINS` in production

---

## Positive Security Findings ✅

1. ✅ **Strong CSP headers** configured in `next.config.ts`
2. ✅ **SSRF protection** in `url-safety.ts`
3. ✅ **Rate limiting** infrastructure in place (Upstash)
4. ✅ **Webhook signature verification** (Stripe, Paystack)
5. ✅ **AES-256-GCM encryption** for webhook secrets
6. ✅ **SQL injection protection** via Prisma ORM
7. ✅ **HSTS, X-Frame-Options, X-Content-Type-Options** headers
8. ✅ **Audit logging** for admin actions
9. ✅ **IP anonymization** for visitor tracking (HMAC-SHA256)
10. ✅ **Bot ownership validation** before operations

---

## Production Deployment Checklist

### Before Launch:
- [ ] Revoke all exposed secrets and generate new ones
- [ ] Fix all npm vulnerabilities (audit fix)
- [ ] Configure production Stripe keys
- [ ] Verify Upstash Redis is configured and tested
- [ ] Encrypt calendar connection tokens (migration)
- [ ] Add environment variable validation at startup
- [ ] Add Zod validation to all API inputs
- [ ] Configure database connection pooling
- [ ] Set up database backups (Neon)
- [ ] Configure Sentry for production
- [ ] Set `WIDGET_ALLOWED_ORIGINS` for production domains
- [ ] Test all webhook endpoints with production data
- [ ] Load test critical paths (chat, checkout)
- [ ] Set up monitoring/alerting (Sentry, Uptime Robot)
- [ ] Document incident response playbook
- [ ] Set up log aggregation (if not using Vercel)
- [ ] Configure CDN for static assets (if needed)
- [ ] Enable DDoS protection (Cloudflare/Vercel)
- [ ] Set up status page (status.faztino.com)

### After Launch:
- [ ] Monitor error rates (Sentry)
- [ ] Monitor API latency (p95, p99)
- [ ] Monitor database connections
- [ ] Monitor OpenAI API costs
- [ ] Set up budget alerts (Stripe, OpenAI, infrastructure)
- [ ] Regular security audits
- [ ] Dependency updates (weekly)
- [ ] Review audit logs (weekly)

---

## Scalability Recommendations for 100k+ Users

### Database:
1. Enable Neon autoscaling
2. Add read replicas for analytics queries
3. Implement query result caching (Redis)
4. Archive old messages/leads (>90 days)
5. Partition large tables (Message, AuditLog)

### Infrastructure:
1. Use Vercel Edge Functions for chat endpoint (low latency)
2. Configure auto-scaling (Vercel does this by default)
3. Add Redis caching for:
   - Bot configurations
   - User plans/quotas
   - RAG embeddings (if feasible)
4. Use CDN for widget.js (Vercel Edge Network)

### Cost Optimization:
1. Monitor OpenAI API usage per user/bot
2. Implement aggressive caching for embeddings
3. Use cheaper models for simple queries (gpt-4o-mini)
4. Add usage alerts when costs spike

### Observability:
1. Add custom metrics (Prometheus/Datadog):
   - Chat response latency
   - OpenAI token usage
   - Database query times
   - Rate limit hit rates
2. Set up on-call rotation
3. Create runbooks for common incidents

---

## Estimated Effort

| Task | Priority | Effort | Owner |
|------|----------|--------|-------|
| Revoke/rotate secrets | CRITICAL | 2h | DevOps |
| Fix npm vulnerabilities | CRITICAL | 1h | Dev |
| Production Stripe keys | CRITICAL | 1h | Finance/Dev |
| Validate Upstash config | CRITICAL | 2h | Dev |
| Encrypt calendar tokens | CRITICAL | 4h | Dev |
| Env validation | HIGH | 3h | Dev |
| Input validation (Zod) | HIGH | 8h | Dev |
| Database pooling | HIGH | 2h | Dev |
| Backup setup | HIGH | 2h | DevOps |
| Load testing | MEDIUM | 4h | QA |
| Monitoring setup | MEDIUM | 4h | DevOps |

**Total Effort:** ~33 hours (1 week for 1 developer)

---

## Next Steps

1. **Immediate (Today):** Secure secrets, fix critical vulnerabilities
2. **This Week:** Fix high-priority issues, add validation
3. **Before Launch:** Complete all checklist items
4. **After Launch:** Monitor, iterate, optimize

This app has a solid foundation but needs production hardening before handling real customer data and payments at scale.
