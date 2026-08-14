import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { OrdersListClient } from "@/components/admin/orders/OrdersListClient";

export const metadata = {
  title: "Orders | Admin",
};

export default async function OrdersPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Orders</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Manage and track all customer orders.
        </p>
      </div>

      <Suspense fallback={<div className="text-sm text-ink-muted">Loading orders...</div>}>
        <OrdersListClient />
      </Suspense>
    </div>
  );
}
