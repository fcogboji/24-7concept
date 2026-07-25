# Production Deployment Guide
**For Faztino (100k+ Users)**

## Pre-Launch Security Checklist

### 1. Secrets Management (CRITICAL)

#### Immediate Actions:
```bash
# 1. Revoke ALL exposed secrets immediately
# - Database credentials
# - OpenAI API key
# - Stripe keys (test and live)
# - Clerk keys
# - Upstash tokens
# - All other API keys in .env

# 2. Generate new secrets
openssl rand -base64 32  # For SECRET_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # For CRON_SECRET
npx web-push generate-vapid-keys  # For VAPID keys

# 3. Get production keys from providers:
# - Stripe: https://dashboard.stripe.com/apikeys (use LIVE keys)
# - Clerk: https://dashboard.clerk.com (use PRODUCTION instance)
# - OpenAI: https://platform.openai.com/api-keys
# - Upstash: https://console.upstash.com
# - Resend: https://resend.com/api-keys
```

#### Never Commit Secrets:
- ✅ .env is in .gitignore
- ✅ Use .env.example with placeholders
- ⚠️ Audit git history: `git log --all --full-history -- .env`
- If secrets were committed, use BFG Repo-Cleaner to remove from history

---

### 2. Environment Variables Setup

Set these in your production environment (Vercel, Railway, etc.):

#### REQUIRED:
```bash
# Database
DATABASE_URL="postgresql://..."  # Neon pooler URL
DIRECT_URL="postgresql://..."    # Neon direct URL for migrations

# OpenAI
OPENAI_API_KEY="sk-proj-..."

# App
NEXT_PUBLIC_APP_URL="https://www.faztino.com"  # Must be HTTPS!

# Clerk (PRODUCTION keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."

# Stripe (LIVE keys)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_STARTER="price_..."
STRIPE_PRICE_PRO="price_..."

# Security
SECRET_ENCRYPTION_KEY="..." # 32+ byte secret
CRON_SECRET="..."           # 16+ byte secret

# Rate Limiting (REQUIRED for production)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:support@faztino.com"
```

#### RECOMMENDED:
```bash
# Monitoring
SENTRY_DSN="https://..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="faztino"

# Email
RESEND_API_KEY="re_..."

# Security
HEALTH_CHECK_SECRET="..."  # Protect /api/health endpoint
WIDGET_ALLOWED_ORIGINS="https://www.faztino.com,https://app.faztino.com"

# Admin Access
ADMIN_CLERK_USER_IDS="user_xxx,user_yyy"  # Comma-separated
```

---

### 3. Database Setup (Neon)

#### Configuration:
```typescript
// Already configured in prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

#### Actions:
```bash
# 1. Enable Neon autoscaling
# Go to Neon dashboard → Settings → Autoscaling
# Set compute to 0.25 - 4 CU for production

# 2. Enable Point-in-Time Recovery
# Neon dashboard → Backups → Enable PITR
# Retention: 7 days minimum

# 3. Run migrations
npx prisma migrate deploy

# 4. Verify indexes exist
npx prisma db execute --stdin < check-indexes.sql
```

#### Connection Pooling:
Neon's connection pooler is already used via `DATABASE_URL`. No additional config needed.

#### Monitoring:
- Set up Neon metrics dashboard
- Alert on connection count >80% of limit
- Alert on query latency p99 >500ms
- Alert on error rate >1%

---

### 4. Stripe Configuration

#### Production Setup:
1. **Get Live API Keys**
   - Dashboard: https://dashboard.stripe.com/apikeys
   - Copy "Secret key" and "Publishable key" (starts with `sk_live_` and `pk_live_`)

2. **Create Products & Prices**
   ```bash
   # Starter Plan
   - Product: "Starter Plan"
   - Prices:
     - Monthly: price_xxx (set STRIPE_PRICE_STARTER)
     - Yearly: price_yyy (set STRIPE_PRICE_STARTER_YEARLY)

   # Pro Plan
   - Product: "Pro Plan"
   - Prices:
     - Monthly: price_zzz (set STRIPE_PRICE_PRO_MONTHLY)
     - Yearly: price_aaa (set STRIPE_PRICE_PRO_YEARLY)
   ```

3. **Configure Webhooks**
   - URL: `https://www.faztino.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`

4. **Test Webhooks**
   ```bash
   # Install Stripe CLI
   stripe listen --forward-to localhost:3000/api/stripe/webhook

   # Trigger test events
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.updated
   ```

5. **Customer Portal**
   - Enable at: https://dashboard.stripe.com/settings/billing/portal
   - Allow: Cancel subscriptions, Update payment method
   - Redirect: `https://www.faztino.com/dashboard`

---

### 5. Security Hardening

#### CSP Headers:
Already configured in `next.config.ts`. Verify:
- ✅ `unsafe-eval` is removed in production
- ✅ All external domains are whitelisted
- ✅ `frame-ancestors 'self'` prevents clickjacking

#### Rate Limiting:
```typescript
// Verify Upstash is configured
// src/lib/rate-limit.ts will BLOCK ALL requests if missing!
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

#### CORS:
```bash
# Restrict widget to your domains only
WIDGET_ALLOWED_ORIGINS="https://www.faztino.com,https://app.faztino.com"
```

#### Input Validation:
Use new validation utilities:
```typescript
import { chatMessageSchema, emailSchema } from "@/lib/input-validation";

// In API routes:
const { message } = chatMessageSchema.parse(await req.json());
```

---

### 6. Monitoring & Alerting

#### Sentry Setup:
```bash
# Set environment variables
SENTRY_DSN="https://xxx@yyy.ingest.sentry.io/zzz"
SENTRY_ORG="your-org"
SENTRY_PROJECT="faztino"
SENTRY_AUTH_TOKEN="..."  # For source maps

# Configure sample rate in next.config.js
sampleRate: 0.1  # Sample 10% of errors in production
```

#### Alerts to Configure:
1. **Error Rate** > 1% for 5 minutes
2. **API Latency** p99 > 2s for 5 minutes
3. **Database Connections** > 80% of limit
4. **OpenAI API Errors** > 5 in 1 minute
5. **Stripe Webhook Failures** > 3 in 1 hour
6. **Rate Limit Hit Rate** > 10% for 5 minutes

#### Uptime Monitoring:
- Use Vercel Analytics (included)
- Or set up Uptime Robot: https://uptimerobot.com
  - Monitor: `https://www.faztino.com/api/health`
  - Interval: 5 minutes
  - Alert: Email, SMS, Slack

#### Cost Monitoring:
```bash
# OpenAI
- Set budget alerts at https://platform.openai.com/account/billing/limits
- Alert at 50%, 75%, 90% of monthly budget

# Stripe
- Monitor failed payments dashboard daily
- Set up email alerts for failed charges

# Infrastructure (Vercel)
- Set spend limit in dashboard
- Alert when approaching limit
```

---

### 7. Performance Optimization

#### Caching Strategy:
```typescript
// Add to API routes that fetch bot config
export const revalidate = 60; // Cache for 60 seconds

// Example: src/app/api/bots/[id]/route.ts
```

#### Database Optimizations:
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_session_created 
  ON "Message" ("botId", "sessionId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_status_created 
  ON "Lead" ("botId", "status", "createdAt" DESC);

-- Archive old data (run monthly)
DELETE FROM "AuditLog" WHERE "createdAt" < NOW() - INTERVAL '90 days';
DELETE FROM "Message" WHERE "createdAt" < NOW() - INTERVAL '90 days';
```

#### CDN Configuration:
Vercel Edge Network handles this automatically. Verify:
- `/widget.js` is served from edge
- Static assets have long cache headers
- Images use Next.js Image Optimization

---

### 8. Deployment Process

#### Pre-Deploy:
```bash
# 1. Run tests
npm test

# 2. Run linter
npm run lint

# 3. Check for type errors
npx tsc --noEmit

# 4. Build locally to catch issues
npm run build

# 5. Validate environment
node -e "require('./src/lib/env-validation').validateProductionEnv()"
```

#### Deploy to Vercel:
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project
vercel link

# 3. Set environment variables
vercel env add STRIPE_SECRET_KEY production
vercel env add CLERK_SECRET_KEY production
# ... repeat for all secrets

# 4. Deploy
vercel --prod

# 5. Run post-deploy checks
curl https://www.faztino.com/api/health
```

#### Post-Deploy Verification:
- [ ] Health check returns 200: `curl -H "Authorization: Bearer $HEALTH_CHECK_SECRET" https://www.faztino.com/api/health`
- [ ] Widget loads: `https://www.faztino.com/widget.js`
- [ ] Clerk login works
- [ ] Stripe checkout works (test with $1 charge)
- [ ] Webhooks are receiving events (check Stripe dashboard)
- [ ] Chat functionality works
- [ ] Sentry receives test error
- [ ] Push notifications work

---

### 9. Incident Response

#### Runbooks:

**Database Connection Exhaustion:**
```bash
# 1. Check current connections
SELECT count(*) FROM pg_stat_activity;

# 2. Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND state_change < NOW() - INTERVAL '5 minutes';

# 3. Increase connection limit in Neon dashboard (temporary)
# 4. Deploy fix: reduce connection pool size in Prisma
```

**OpenAI Rate Limit:**
```bash
# 1. Check current usage: https://platform.openai.com/usage
# 2. Temporarily disable non-essential bots
# 3. Enable fallback responses in chat endpoint
# 4. Contact OpenAI support for limit increase
```

**Payment Failures:**
```bash
# 1. Check Stripe dashboard for failed charges
# 2. Review customer subscription status
# 3. Send email to affected users
# 4. Manually retry payment or extend grace period
```

#### On-Call Rotation:
- Set up PagerDuty or Opsgenie
- Escalation: 5min → 15min → 30min
- Document: https://www.notion.so/runbooks

---

### 10. Compliance & Legal

#### GDPR:
- [ ] Privacy policy published: `/privacy`
- [ ] Cookie consent banner implemented
- [ ] User data export API (if needed)
- [ ] User deletion API (cascade deletes configured in Prisma)
- [ ] Audit logs for admin actions

#### PCI DSS:
- ✅ No card data stored locally (Stripe handles it)
- ✅ HTTPS enforced
- ✅ Stripe webhooks validated

#### Security Audit:
- Run OWASP ZAP scan before launch
- Schedule annual pen test
- Bug bounty program (optional)

---

## Launch Day Checklist

### 24 Hours Before:
- [ ] Final security review
- [ ] Database backups verified
- [ ] Monitoring dashboards configured
- [ ] On-call rotation set up
- [ ] Status page ready: https://status.faztino.com
- [ ] Support email configured: support@faztino.com
- [ ] Blog post drafted
- [ ] Social media posts scheduled

### 1 Hour Before:
- [ ] Final deploy to production
- [ ] Smoke tests pass
- [ ] All team members notified
- [ ] War room channel created (#launch-war-room)

### Launch:
- [ ] Flip DNS / make site public
- [ ] Monitor error rates (Sentry)
- [ ] Monitor API latency (Vercel)
- [ ] Monitor database load (Neon)
- [ ] Monitor support emails
- [ ] Post on social media
- [ ] Send launch email to waitlist

### First Week:
- [ ] Monitor metrics daily
- [ ] Review audit logs
- [ ] Check for anomalies
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Optimize slow queries

---

## Post-Launch Maintenance

### Daily:
- Check error rate (Sentry)
- Check failed payments (Stripe)
- Review support tickets

### Weekly:
- Review audit logs
- Check dependency updates: `npm outdated`
- Review database performance
- Analyze user metrics

### Monthly:
- Security audit
- Dependency updates: `npm update`
- Database optimization (vacuum, reindex)
- Cost review
- User feedback review

### Quarterly:
- Disaster recovery drill
- Penetration test
- Review and update runbooks
- Team retro

---

## Cost Estimates (100k Users)

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Vercel Pro | $20 | Included: hosting, CDN, analytics |
| Neon DB | $50-200 | Depends on compute usage |
| Upstash Redis | $50-100 | Depends on request volume |
| OpenAI API | $500-5000 | Highly variable, depends on usage |
| Clerk Auth | $25-100 | $25/month for 10k MAU, then $0.02/user |
| Stripe | ~3% revenue | Transaction fees |
| Resend Email | $20-50 | 50k emails/month |
| Sentry | $26-80 | Depends on events |
| **Total** | **$691-5570/mo** | Excluding revenue-based fees |

### Cost Optimization:
- Use GPT-4o-mini for simple queries ($0.15/1M tokens vs $2.50/1M for GPT-4)
- Cache embeddings aggressively
- Implement usage quotas per plan
- Archive old messages to cold storage

---

## Support

- Documentation: https://docs.faztino.com
- Status: https://status.faztino.com  
- Email: support@faztino.com
- Slack: #faztino-support (internal)

---

Generated: 2026-07-25
Version: 1.0
