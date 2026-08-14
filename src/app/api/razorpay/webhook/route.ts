import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/checkout/razorpay";

/**
 * Razorpay payment webhook — the authoritative payment signal.
 *
 * The browser callback can be lost (closed tab, dead network), so an order must
 * still reach `paid` through this route. Handlers are idempotent: Razorpay
 * retries, and a repeat delivery must not corrupt the order.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  // The signature covers the exact bytes sent, so it must be checked against
  // the raw body — parsing first and re-serialising would change it.
  const rawBody = await request.text();

  let valid: boolean;
  try {
    valid = verifyWebhookSignature(rawBody, signature);
  } catch {
    // Secret not configured: fail closed rather than accepting unverified calls.
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; error_description?: string } };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;

  if (!payment?.order_id) {
    // Nothing actionable, but a non-2xx would make Razorpay retry forever.
    return NextResponse.json({ received: true });
  }

  const db = createAdminClient();

  if (event.event === "payment.captured") {
    await db
      .from("orders")
      .update({
        payment_status: "paid",
        razorpay_payment_id: payment.id ?? null,
        status: "confirmed",
      })
      .eq("razorpay_order_id", payment.order_id)
      // Never resurrect an order the shop already cancelled or delivered.
      .in("status", ["pending", "confirmed"]);
  }

  if (event.event === "payment.failed") {
    await db
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("razorpay_order_id", payment.order_id)
      .eq("payment_status", "unpaid");
  }

  return NextResponse.json({ received: true });
}
