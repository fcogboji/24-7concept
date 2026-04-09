import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-stone-100 md:flex-row">
      <AdminSidebar />
      <main className="min-h-screen flex-1 overflow-x-hidden pt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:pt-0">
        <div className="mx-auto max-w-6xl p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
