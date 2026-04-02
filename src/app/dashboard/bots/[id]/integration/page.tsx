import { notFound, redirect } from "next/navigation";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";

/** Legacy URL — same two-column Widget + Integration screen as `/appearance` */
export default async function BotIntegrationPage({ params }: { params: Promise<{ id: string }> }) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const { id } = await params;
  const bot = await prisma.bot.findFirst({
    where: { id, userId: appUser.id },
    select: { id: true },
  });

  if (!bot) notFound();

  redirect(`/dashboard/bots/${id}/appearance`);
}
