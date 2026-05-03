-- Backfill subscriptionStatus for any existing Starter/Pro user rows that
-- predate the strict null=inactive rule in src/lib/plan.ts.
--
-- Run once against production after deploying the plan.ts change:
--   psql "$DIRECT_URL" -f prisma/manual-migrations/0001_subscription_status_backfill.sql
--
-- Safe to re-run; only updates rows still missing a status.

UPDATE "User"
   SET "subscriptionStatus" = 'active'
 WHERE ("subscriptionStatus" IS NULL OR "subscriptionStatus" = '')
   AND "plan" IN ('starter', 'pro');
