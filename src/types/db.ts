/**
 * Domain aliases over the generated Supabase types.
 *
 * database.ts is generated — never edit it by hand. Regenerate with:
 *   npx supabase gen types typescript --linked --schema public > src/types/database.ts
 * Put anything hand-written here instead.
 */
import type { Database } from "./database";

type Tables = Database["public"]["Tables"];

export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type Insert<T extends keyof Tables> = Tables[T]["Insert"];
export type Update<T extends keyof Tables> = Tables[T]["Update"];

export type ProfileRow = Row<"profiles">;
export type CategoryRow = Row<"categories">;
export type ProductRow = Row<"products">;
export type ProductImageRow = Row<"product_images">;
export type ProductVariantRow = Row<"product_variants">;
export type DeliveryAreaRow = Row<"delivery_areas">;
export type DeliverySlotRow = Row<"delivery_slots">;
export type OrderRow = Row<"orders">;
export type OrderItemRow = Row<"order_items">;
export type ReviewRow = Row<"reviews">;

/**
 * The status columns are text with CHECK constraints, so the generated types
 * widen them to `string`. These narrow them back for application code.
 */
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "baking",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["razorpay", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type UserRole = "customer" | "admin";

/** A product joined with everything the detail page and admin form need. */
export type ProductWithRelations = ProductRow & {
  product_images: ProductImageRow[];
  product_variants: ProductVariantRow[];
  categories: Pick<CategoryRow, "id" | "name" | "slug" | "route_segment"> | null;
};

/** Rupee-formatted price from integer paise. */
export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
