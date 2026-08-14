import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * What the browser sends. Prices are deliberately absent: the cart lives in
 * localStorage, which the user can edit, so every amount is recomputed here
 * from the database. Never trust a price that arrived over the wire.
 */
export interface CartLineInput {
  variantId: number;
  quantity: number;
  cakeMessage?: string | null;
  photoUrl?: string | null;
}

export interface PricedLine {
  productId: number;
  variantId: number;
  productName: string;
  weightLabel: string;
  imageUrl: string | null;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
  cakeMessage: string | null;
  photoUrl: string | null;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotalPaise: number;
  deliveryFeePaise: number;
  surchargePaise: number;
  totalPaise: number;
}

export class CheckoutError extends Error {}

const MAX_QUANTITY = 20;
const MAX_LINES = 20;
/** A cake topper cannot hold more than this. */
const MAX_MESSAGE_LENGTH = 25;

/**
 * Recomputes the cart from authoritative data.
 *
 * Also enforces availability: a variant that was deactivated while sitting in
 * someone's cart must not be sellable.
 */
export async function priceCart(
  lines: CartLineInput[],
  options: { pincode: string; deliverySlotId: number | null },
): Promise<PricedCart> {
  if (lines.length === 0) {
    throw new CheckoutError("Your cart is empty.");
  }
  if (lines.length > MAX_LINES) {
    throw new CheckoutError("Too many items in one order.");
  }

  for (const line of lines) {
    if (!Number.isInteger(line.variantId) || line.variantId <= 0) {
      throw new CheckoutError("Your cart contains an invalid item.");
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY) {
      throw new CheckoutError("Item quantity must be between 1 and 20.");
    }
    if (line.cakeMessage && line.cakeMessage.length > MAX_MESSAGE_LENGTH) {
      throw new CheckoutError(`Cake messages are limited to ${MAX_MESSAGE_LENGTH} characters.`);
    }
  }

  // Service role: the price lookup must succeed for guests too, and reading
  // catalog rows here exposes nothing the storefront does not already show.
  const db = createAdminClient();

  const variantIds = [...new Set(lines.map((line) => line.variantId))];

  const { data: variants, error } = await db
    .from("product_variants")
    .select(
      "id, product_id, weight_label, price_paise, is_active, products(id, name, is_active, product_images(url, position))",
    )
    .in("id", variantIds);

  if (error) throw new CheckoutError(`Could not price your cart: ${error.message}`);

  const byId = new Map((variants ?? []).map((variant) => [variant.id, variant]));

  const priced: PricedLine[] = lines.map((line) => {
    const variant = byId.get(line.variantId);

    if (!variant || !variant.is_active || !variant.products?.is_active) {
      throw new CheckoutError(
        "An item in your cart is no longer available. Remove it and try again.",
      );
    }

    const images = variant.products.product_images ?? [];
    const primary = [...images].sort((a, b) => a.position - b.position)[0];

    return {
      productId: variant.product_id,
      variantId: variant.id,
      productName: variant.products.name,
      weightLabel: variant.weight_label,
      imageUrl: primary?.url ?? null,
      unitPricePaise: variant.price_paise,
      quantity: line.quantity,
      lineTotalPaise: variant.price_paise * line.quantity,
      cakeMessage: line.cakeMessage?.trim() || null,
      photoUrl: line.photoUrl ?? null,
    };
  });

  const subtotalPaise = priced.reduce((sum, line) => sum + line.lineTotalPaise, 0);

  const { data: area } = await db
    .from("delivery_areas")
    .select("delivery_fee_paise, is_serviceable")
    .eq("pincode", options.pincode)
    .maybeSingle();

  if (!area || !area.is_serviceable) {
    throw new CheckoutError("We do not deliver to that pincode yet.");
  }

  let surchargePaise = 0;

  if (options.deliverySlotId !== null) {
    const { data: slot } = await db
      .from("delivery_slots")
      .select("surcharge_paise, is_active")
      .eq("id", options.deliverySlotId)
      .maybeSingle();

    if (!slot || !slot.is_active) {
      throw new CheckoutError("That delivery slot is no longer available.");
    }
    surchargePaise = slot.surcharge_paise;
  }

  const deliveryFeePaise = area.delivery_fee_paise;

  return {
    lines: priced,
    subtotalPaise,
    deliveryFeePaise,
    surchargePaise,
    totalPaise: subtotalPaise + deliveryFeePaise + surchargePaise,
  };
}
