"use server";

import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CheckoutError, priceCart, type CartLineInput } from "./pricing";
import { createRazorpayOrder, isRazorpayConfigured, verifyPaymentSignature } from "./razorpay";

const lineSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
  cakeMessage: z.string().max(25).nullish(),
  photoUrl: z.string().url().nullish(),
});

const checkoutSchema = z.object({
  recipientName: z.string().trim().min(2, "Enter the recipient's name").max(80),
  recipientPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"),
  addressLine1: z.string().trim().min(5, "Enter the delivery address").max(200),
  addressLine2: z.string().trim().max(200).nullish(),
  city: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid pincode"),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a delivery date"),
  deliverySlotId: z.number().int().positive().nullable(),
  deliveryInstructions: z.string().trim().max(300).nullish(),
  paymentMethod: z.enum(["razorpay", "cod"]),
  lines: z.array(lineSchema).min(1, "Your cart is empty"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export interface CheckoutResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  orderNumber?: string;
  orderId?: number;
  /** Present only for the Razorpay path; the browser opens Checkout with it. */
  razorpay?: { orderId: string; amountPaise: number; keyId: string };
}

/** Orders can be placed today at the earliest, and 30 days out at the latest. */
function validateDeliveryDate(value: string): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const chosen = new Date(`${value}T00:00:00`);
  if (Number.isNaN(chosen.getTime())) return "Choose a delivery date.";
  if (chosen < today) return "Delivery date cannot be in the past.";

  const latest = new Date(today);
  latest.setDate(latest.getDate() + 30);
  if (chosen > latest) return "We take orders up to 30 days ahead.";

  return null;
}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      ),
    };
  }

  const data = parsed.data;

  const dateError = validateDeliveryDate(data.deliveryDate);
  if (dateError) return { ok: false, fieldErrors: { deliveryDate: dateError } };

  if (data.paymentMethod === "razorpay" && !isRazorpayConfigured()) {
    return { ok: false, error: "Online payment is unavailable right now. Choose cash on delivery." };
  }

  // Every amount below comes from the database, never from the request body.
  let priced;
  try {
    priced = await priceCart(data.lines as CartLineInput[], {
      pincode: data.pincode,
      deliverySlotId: data.deliverySlotId,
    });
  } catch (error) {
    if (error instanceof CheckoutError) return { ok: false, error: error.message };
    throw error;
  }

  // Attach the order to the signed-in customer when there is one; guests are
  // allowed, and their order is reachable by order number alone.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const db = createAdminClient();

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      status: "pending",
      subtotal_paise: priced.subtotalPaise,
      delivery_fee_paise: priced.deliveryFeePaise + priced.surchargePaise,
      discount_paise: 0,
      total_paise: priced.totalPaise,
      recipient_name: data.recipientName,
      recipient_phone: data.recipientPhone,
      address_line1: data.addressLine1,
      address_line2: data.addressLine2 ?? null,
      city: data.city,
      pincode: data.pincode,
      delivery_date: data.deliveryDate,
      delivery_slot_id: data.deliverySlotId,
      delivery_instructions: data.deliveryInstructions ?? null,
      payment_method: data.paymentMethod,
      payment_status: "unpaid",
    })
    .select("id, order_number, total_paise")
    .single();

  if (orderError || !order) {
    return { ok: false, error: "Could not place your order. Please try again." };
  }

  const { error: itemsError } = await db.from("order_items").insert(
    priced.lines.map((line) => ({
      order_id: order.id,
      product_id: line.productId,
      variant_id: line.variantId,
      product_name: line.productName,
      weight_label: line.weightLabel,
      image_url: line.imageUrl,
      unit_price_paise: line.unitPricePaise,
      quantity: line.quantity,
      cake_message: line.cakeMessage,
      photo_url: line.photoUrl,
    })),
  );

  if (itemsError) {
    // An order with no lines is worse than no order: the kitchen would see a
    // paid ticket with nothing to bake.
    await db.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "Could not save your items. Please try again." };
  }

  if (data.paymentMethod === "cod") {
    await db.from("orders").update({ status: "confirmed" }).eq("id", order.id);
    return { ok: true, orderNumber: order.order_number, orderId: order.id };
  }

  try {
    const razorpayOrder = await createRazorpayOrder({
      amountPaise: order.total_paise,
      receipt: order.order_number,
      notes: { order_number: order.order_number },
    });

    await db
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", order.id);

    return {
      ok: true,
      orderNumber: order.order_number,
      orderId: order.id,
      razorpay: {
        orderId: razorpayOrder.id,
        amountPaise: order.total_paise,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      },
    };
  } catch {
    await db.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    return { ok: false, error: "Could not start the payment. Please try again." };
  }
}

/**
 * Confirms a payment from the browser callback.
 *
 * The webhook is the authoritative signal, but customers expect the success
 * page immediately, so this path verifies the signature and marks the order
 * paid as well. Both are idempotent.
 */
export async function confirmPayment(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): Promise<{ ok: boolean; orderNumber?: string; error?: string }> {
  if (!verifyPaymentSignature(input)) {
    return { ok: false, error: "Payment could not be verified." };
  }

  const db = createAdminClient();

  const { data: order, error } = await db
    .from("orders")
    .update({
      payment_status: "paid",
      razorpay_payment_id: input.razorpayPaymentId,
      status: "confirmed",
    })
    .eq("razorpay_order_id", input.razorpayOrderId)
    .select("order_number")
    .single();

  if (error || !order) {
    return { ok: false, error: "We could not find that order." };
  }

  return { ok: true, orderNumber: order.order_number };
}
