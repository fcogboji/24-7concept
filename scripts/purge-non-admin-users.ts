/**
 * One-off cleanup script: deletes every User row except the configured admin,
 * along with their bots (and the cascade of sources/messages/leads/bookings).
 *
 * Schema notes that drive the order:
 *   - Bot.user has onDelete: Restrict, so we must delete bots BEFORE users.
 *   - Webhook.user is Cascade (auto-deletes with the user).
 *   - AuditLog.user is SetNull (rows preserved, userId nulled).
 *   - Bot has Cascade to Source / Message / Lead / BookingConfig.
 *
 * Run as a dry run first (prints counts + emails, no writes):
 *   DATABASE_URL=<prod-url> npx tsx scripts/purge-non-admin-users.ts
 *
 * Run for real after reviewing the dry-run output:
 *   DATABASE_URL=<prod-url> npx tsx scripts/purge-non-admin-users.ts --confirm
 *
 * The script refuses to run if ADMIN_EMAIL doesn't match any User row.
 */

import { PrismaClient } from "@prisma/client";

const ADMIN_EMAIL = "friday.ogboji100@gmail.com";
// Additional emails to spare (kept alongside the admin). Lower-case for compare.
const EXTRA_KEEP_EMAILS = ["demo@faztino.app"];

function dbHostFromUrl(url: string | undefined): string {
  if (!url) return "<no DATABASE_URL set>";
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`;
  } catch {
    return "<unparseable DATABASE_URL>";
  }
}

async function main() {
  const confirm = process.argv.includes("--confirm");
  const prisma = new PrismaClient();

  console.log("DB target:        ", dbHostFromUrl(process.env.DATABASE_URL));
  console.log("Admin to keep:    ", ADMIN_EMAIL);
  console.log("Mode:             ", confirm ? "EXECUTE (will delete)" : "DRY RUN (no writes)");
  console.log("");

  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    console.error(
      `REFUSING TO RUN: no User row with email=${ADMIN_EMAIL}. ` +
        `Sign in once on the live site as the admin so getOrCreateAppUser creates the row, then re-run.`,
    );
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log("Admin User row:   ", admin.id, "| plan:", admin.plan);

  const keepEmailsLc = new Set(
    [admin.email, ...EXTRA_KEEP_EMAILS].map((e) => e.toLowerCase()),
  );
  const keepRows = await prisma.user.findMany({
    where: { email: { in: Array.from(keepEmailsLc), mode: "insensitive" } },
    select: { id: true, email: true },
  });
  const keepIds = keepRows.map((r) => r.id);
  console.log("Also keeping:     ", keepRows.filter((r) => r.id !== admin.id).map((r) => r.email).join(", ") || "—");

  const targets = await prisma.user.findMany({
    where: { id: { notIn: keepIds } },
    select: {
      id: true,
      email: true,
      plan: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      _count: { select: { bots: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\nUsers to delete: ${targets.length}`);
  if (targets.length === 0) {
    console.log("Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  for (const u of targets) {
    const billing = u.stripeSubscriptionId ? ` ⚠️  has live Stripe sub ${u.stripeSubscriptionId}` : "";
    console.log(
      `  - ${u.email}  [plan=${u.plan} status=${u.subscriptionStatus ?? "—"} bots=${u._count.bots}]${billing}`,
    );
  }

  const billingTargets = targets.filter((u) => u.stripeSubscriptionId);
  if (billingTargets.length > 0) {
    console.log(
      `\n⚠️  ${billingTargets.length} of these have Stripe subscriptions on file. ` +
        `Deleting the User row does NOT cancel the Stripe subscription — Stripe will keep billing them. ` +
        `Cancel those subs in the Stripe dashboard first if that's what you want.`,
    );
  }

  if (!confirm) {
    console.log("\nDry run only. Re-run with --confirm to execute.");
    await prisma.$disconnect();
    return;
  }

  const targetIds = targets.map((t) => t.id);

  console.log("\nPurging bots (cascades sources/messages/leads/bookings)…");
  const bots = await prisma.bot.deleteMany({ where: { userId: { in: targetIds } } });
  console.log(`  deleted ${bots.count} bots`);

  console.log("Deleting users (cascades webhooks; nulls audit-log userId)…");
  const users = await prisma.user.deleteMany({ where: { id: { in: targetIds } } });
  console.log(`  deleted ${users.count} users`);

  console.log("\nDone.");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Failed:", err);
  process.exit(1);
});
