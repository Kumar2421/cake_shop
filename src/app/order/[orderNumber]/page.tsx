import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPaise } from "@/types/db";

export const metadata: Metadata = {
  title: "Order confirmed | Bakingo",
  robots: { index: false },
};

/**
 * Order confirmation, reachable by order number alone so guests can see it.
 *
 * The order number is a sequential, guessable id, so this page shows only what
 * the customer already knows — items, totals, delivery window. It deliberately
 * omits the full address and phone number, which would otherwise leak to anyone
 * who increments the number in the URL.
 */
export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select(
      "order_number, status, payment_status, payment_method, subtotal_paise, delivery_fee_paise, total_paise, delivery_date, city, order_items(product_name, weight_label, quantity, unit_price_paise, image_url, cake_message), delivery_slots(label)",
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) notFound();

  const paid = order.payment_status === "paid";
  const cod = order.payment_method === "cod";

  return (
    <>
      <SiteHeader />
      <main className="flex w-full flex-col bg-[#f1f1f1] pt-[56px] md:pt-[128px]">
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <div className="rounded-xl bg-white p-6 text-center">
            {paid || cod ? (
              <CheckCircle2 className="mx-auto size-10 text-brand-green" aria-hidden />
            ) : (
              <Clock className="mx-auto size-10 text-ink-muted" aria-hidden />
            )}

            <h1 className="mt-3 text-xl font-semibold text-ink">
              {paid || cod ? "Order confirmed" : "Order received"}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {cod
                ? "Pay the delivery partner when your cake arrives."
                : paid
                  ? "We have your payment. The kitchen is on it."
                  : "We are still waiting for payment confirmation."}
            </p>

            <p className="mt-4 inline-block rounded-lg bg-brand-pink-tint px-4 py-2 text-sm font-semibold text-brand-red">
              {order.order_number}
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-white p-6">
            <h2 className="text-base font-semibold text-ink">Your order</h2>

            <ul className="mt-4 flex flex-col gap-4">
              {order.order_items.map((item, index) => (
                <li key={index} className="flex gap-3">
                  {item.image_url && (
                    <Image
                      src={item.image_url}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{item.product_name}</p>
                    <p className="text-xs text-ink-muted">
                      {item.weight_label} × {item.quantity}
                    </p>
                    {item.cake_message && (
                      <p className="mt-1 text-xs text-ink-muted italic">
                        &ldquo;{item.cake_message}&rdquo;
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-ink tabular-nums">
                    {formatPaise(item.unit_price_paise * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 flex flex-col gap-2 border-t border-hairline pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="text-ink tabular-nums">{formatPaise(order.subtotal_paise)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Delivery</dt>
                <dd className="text-ink tabular-nums">
                  {order.delivery_fee_paise === 0 ? "Free" : formatPaise(order.delivery_fee_paise)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-hairline pt-2 text-base font-semibold">
                <dt className="text-ink">Total</dt>
                <dd className="text-ink tabular-nums">{formatPaise(order.total_paise)}</dd>
              </div>
            </dl>

            <div className="mt-5 rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium text-ink">Delivery</p>
              <p className="mt-1 text-ink-muted">
                {new Date(`${order.delivery_date}T00:00:00`).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                {order.delivery_slots?.label ? `, ${order.delivery_slots.label}` : ""} · {order.city}
              </p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-lg border border-hairline bg-white px-5 text-sm font-semibold text-ink hover:bg-muted"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
