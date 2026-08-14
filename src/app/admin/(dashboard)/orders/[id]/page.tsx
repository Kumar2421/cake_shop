import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { OrderDetailClient } from "@/components/admin/orders/OrderDetailClient";
import type { OrderRow } from "@/types/db";

export const metadata = {
  title: "Order Detail | Admin",
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

interface OrderWithRelations extends OrderRow {
  delivery_slots: { id: number; label: string; start_time: string; end_time: string } | null;
  order_items: Array<{
    id: number;
    product_name: string;
    weight_label: string | null;
    quantity: number;
    unit_price_paise: number;
    cake_message: string | null;
    photo_url: string | null;
    image_url: string | null;
  }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  await requireAdmin();
  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    notFound();
  }

  const supabase = await createClient();

  // Fetch order with all related data
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      delivery_slots(id, label, start_time, end_time),
      order_items(
        id,
        product_name,
        weight_label,
        quantity,
        unit_price_paise,
        cake_message,
        photo_url,
        image_url
      )
      `
    )
    .eq("id", orderId)
    .single();

  if (error || !order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-ink">Order {order.order_number}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Placed on {new Date(order.created_at).toLocaleDateString("en-IN", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-hairline bg-white px-4 text-sm font-medium text-ink hover:bg-background transition-colors print:hidden"
        >
          Print Kitchen Slip
        </button>
      </div>

      <OrderDetailClient order={order as OrderWithRelations} />
    </div>
  );
}
