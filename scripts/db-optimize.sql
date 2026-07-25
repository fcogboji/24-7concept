-- Database Optimization Script for Faztino
-- Run this manually via: psql $DATABASE_URL < scripts/db-optimize.sql

-- Add missing indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_session_created 
  ON "Message" ("botId", "sessionId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_status_created 
  ON "Lead" ("botId", "status", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointment_bot_start 
  ON "Appointment" ("botId", "startTime" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visitor_session_bot_first 
  ON "VisitorSession" ("botId", "firstSeenAt" DESC);

-- Analyze tables for query planner
ANALYZE "User";
ANALYZE "Bot";
ANALYZE "Message";
ANALYZE "Lead";
ANALYZE "Appointment";
ANALYZE "VisitorSession";
ANALYZE "AuditLog";

-- Show table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- Show index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Vacuum and reindex (run during low-traffic period)
-- VACUUM ANALYZE;
-- REINDEX DATABASE CONCURRENTLY;
