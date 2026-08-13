/**
 * Database types for the cake shop schema.
 *
 * Hand-maintained to match supabase/migrations/*.sql. Once the Supabase CLI is
 * linked, regenerate with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "baking"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";
export type PaymentMethod = "razorpay" | "cod";
export type UserRole = "customer" | "admin";

type Timestamps = { created_at: string };

export interface ProfileRow extends Timestamps {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  updated_at: string;
}

export interface CategoryRow extends Timestamps {
  id: number;
  parent_id: number | null;
  slug: string;
  name: string;
  route_segment: string | null;
  image_url: string | null;
  position: number;
  is_active: boolean;
}

export interface ProductRow extends Timestamps {
  id: number;
  category_id: number | null;
  slug: string;
  sku: string;
  name: string;
  description: string | null;
  chef_word: string | null;
  base_price_paise: number;
  price_note: string | null;
  rating: number | null;
  review_count: number;
  is_eggless: boolean;
  tag: string | null;
  flavour: string | null;
  is_active: boolean;
  is_bestseller: boolean;
  updated_at: string;
}

export interface ProductImageRow {
  id: number;
  product_id: number;
  url: string;
  alt: string | null;
  position: number;
}

export interface ProductVariantRow {
  id: number;
  product_id: number;
  weight_label: string;
  serving_label: string | null;
  price_paise: number;
  sku: string | null;
  stock: number | null;
  position: number;
  is_active: boolean;
}

export interface DeliveryAreaRow {
  id: number;
  pincode: string;
  city: string;
  is_serviceable: boolean;
  supports_same_day: boolean;
  delivery_fee_paise: number;
}

export interface DeliverySlotRow {
  id: number;
  label: string;
  start_time: string;
  end_time: string;
  surcharge_paise: number;
  position: number;
  is_active: boolean;
}

export interface OrderRow extends Timestamps {
  id: number;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  subtotal_paise: number;
  delivery_fee_paise: number;
  discount_paise: number;
  total_paise: number;
  recipient_name: string;
  recipient_phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  pincode: string;
  delivery_date: string;
  delivery_slot_id: number | null;
  delivery_instructions: string | null;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  updated_at: string;
}

export interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number | null;
  variant_id: number | null;
  product_name: string;
  weight_label: string | null;
  image_url: string | null;
  unit_price_paise: number;
  quantity: number;
  cake_message: string | null;
  photo_url: string | null;
}

export interface ReviewRow extends Timestamps {
  id: number;
  product_id: number;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
}

export interface WishlistItemRow extends Timestamps {
  user_id: string;
  product_id: number;
}

/** Columns the database fills in for us on insert. */
type Generated = "id" | "created_at" | "updated_at";

type TableDef<Row, OptionalOnInsert extends keyof Row = never> = {
  Row: Row;
  Insert: Omit<Row, Extract<Generated | OptionalOnInsert, keyof Row>> &
    Partial<Pick<Row, Extract<Generated | OptionalOnInsert, keyof Row>>>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, "role" | "full_name" | "phone">;
      categories: TableDef<CategoryRow, "position" | "is_active" | "parent_id">;
      products: TableDef<ProductRow, "is_active" | "is_bestseller" | "review_count">;
      product_images: TableDef<ProductImageRow, "position">;
      product_variants: TableDef<ProductVariantRow, "position" | "is_active">;
      delivery_areas: TableDef<DeliveryAreaRow>;
      delivery_slots: TableDef<DeliverySlotRow, "position" | "is_active">;
      orders: TableDef<OrderRow, "order_number" | "status" | "payment_status">;
      order_items: TableDef<OrderItemRow>;
      reviews: TableDef<ReviewRow>;
      wishlist_items: TableDef<WishlistItemRow>;
    };
    Views: Record<never, never>;
    Functions: {
      next_order_number: { Args: Record<never, never>; Returns: string };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
