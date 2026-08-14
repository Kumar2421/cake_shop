import { type ReactNode } from "react";
import Link from "next/link";
import { requireAdmin, getUser } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/AdminNav";
import { MobileNav } from "@/components/admin/MobileNav";
import { AccountMenu } from "@/components/admin/AccountMenu";
import { LiveIndicator } from "@/components/admin/LiveIndicator";
import { Toaster } from "@/components/ui/sonner";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  await requireAdmin();
  const user = await getUser();
  const userInitials = user?.email?.split("@")[0]?.substring(0, 2).toUpperCase() ?? "AD";

  return (
    <div className="flex min-h-screen flex-col bg-muted lg:flex-row">
      {/* Sidebar - Desktop only */}
      <aside className="hidden w-64 border-r border-hairline bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        {/* Brand mark */}
        <div className="border-b border-hairline p-6">
          <Link
            href="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-red text-white font-bold text-sm hover:bg-brand-red-dark transition-colors"
            title="View store"
          >
            B
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-6">
          <AdminNav />
        </nav>

        <div className="px-6 pb-4">
          <LiveIndicator className="w-full justify-center" />
        </div>

        {/* Account info */}
        <div className="border-t border-hairline p-6">
          <AccountMenu user={user} userInitials={userInitials} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-auto">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-hairline bg-white px-4 py-4 lg:hidden">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-ink">Admin</h1>
            <LiveIndicator />
          </div>
          <div className="flex items-center gap-3">
            <AccountMenu user={user} userInitials={userInitials} variant="mobile" />
            <MobileNav />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Product and order mutations report through sonner; without this mount
          those toasts are silently dropped. */}
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
