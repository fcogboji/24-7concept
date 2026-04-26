import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { subscriptionIsActive } from "@/lib/plan";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    redirect("/login");
  }

  const active = subscriptionIsActive(
    appUser.plan,
    appUser.subscriptionStatus ?? null
  );
  const planLabel = (() => {
    if (active) {
      if (appUser.subscriptionStatus === "trialing") {
        return appUser.plan === "starter" ? "Starter (trial)" : "Pro (trial)";
      }
      return appUser.plan === "starter" ? "Starter plan" : "Pro plan";
    }
    if (appUser.plan === "starter" || appUser.plan === "pro") {
      return `${appUser.plan === "starter" ? "Starter" : "Pro"} (inactive)`;
    }
    return "No subscription";
  })();
  const identity = (appUser.name?.trim() || appUser.email || "User").trim();
  const initial = identity.charAt(0).toUpperCase();

  const firstBot = await prisma.bot.findFirst({
    where: { userId: appUser.id },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return (
    <DashboardShell
      firstBotId={firstBot?.id ?? null}
      identity={identity}
      initial={initial}
      planLabel={planLabel}
    >
      {children}
    </DashboardShell>
  );
}
