import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";

import { getMyOrders } from "@/lib/queries/account";
import { getUser } from "@/lib/auth/session";
import { formatPaise } from "@/types/db";

export const metadata: Metadata = {
  title: "My Orders | Bakingo",
  robots: { index: false },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting payment",
  confirmed: "Confirmed",
  baking: "In the kitchen",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function AccountOrdersPage() {
  const user = await getUser();
  if (!user) return null; // The layout already shows the signed-out state.

  const orders = await getMyOrders();

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-12 text-center">
        <Package className="size-8 text-ink-muted" aria-hidden />
        <p className="font-semibold text-ink">No orders yet</p>
        <p className="text-sm text-ink-muted">
          Orders you place while signed in will appear here.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex h-11 items-center rounded-lg bg-brand-red px-5 text-sm font-semibold text-white hover:bg-brand-red-dark"
        >
          Browse cakes
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order) => (
        <li key={order.id} className="rounded-xl bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={`/order/${order.order_number}`}
                className="text-sm font-semibold text-brand-red hover:underline"
              >
                {order.order_number}
              </Link>
              <p className="mt-1 text-xs text-ink-muted">
                Placed{" "}
                {new Date(order.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="text-right">
              {/* Text, not colour alone, carries the status. */}
              <span className="rounded-full bg-brand-pink-tint px-3 py-1 text-xs font-semibold text-brand-red">
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
              <p className="mt-1 text-sm font-semibold text-ink tabular-nums">
                {formatPaise(order.total_paise)}
              </p>
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-3 border-t border-hairline pt-4">
            {order.items.map((item, index) => (
              <li key={index} className="flex gap-3">
                {item.image_url && (
                  <Image
                    src={item.image_url}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{item.product_name}</p>
                  <p className="text-xs text-ink-muted">
                    {item.weight_label} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm text-ink tabular-nums">
                  {formatPaise(item.unit_price_paise * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs text-ink-muted">
            Delivery{" "}
            {new Date(`${order.delivery_date}T00:00:00`).toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
            {order.slotLabel ? `, ${order.slotLabel}` : ""} · {order.city}
          </p>
        </li>
      ))}
    </ul>
  );
}
