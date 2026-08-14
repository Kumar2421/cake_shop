import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AccountOrderItem {
  product_name: string;
  weight_label: string | null;
  quantity: number;
  unit_price_paise: number;
  image_url: string | null;
  cake_message: string | null;
}

export interface AccountOrder {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_paise: number;
  delivery_date: string;
  created_at: string;
  city: string;
  slotLabel: string | null;
  items: AccountOrderItem[];
}

/**
 * The signed-in customer's orders.
 *
 * Uses the per-request client on purpose: the `orders_select_own` RLS policy
 * scopes this to the caller, so a missing or forged id returns nothing rather
 * than someone else's order history.
 */
export async function getMyOrders(): Promise<AccountOrder[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, payment_status, payment_method, total_paise,
       delivery_date, created_at, city,
       delivery_slots(label),
       order_items(product_name, weight_label, quantity, unit_price_paise, image_url, cake_message)`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getMyOrders: ${error.message}`);

  return (data ?? []).map((order) => ({
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    total_paise: order.total_paise,
    delivery_date: order.delivery_date,
    created_at: order.created_at,
    city: order.city,
    slotLabel: order.delivery_slots?.label ?? null,
    items: order.order_items ?? [],
  }));
}

export interface FavouriteProduct {
  id: number;
  slug: string;
  name: string;
  base_price_paise: number;
  routeSegment: string;
  imageUrl: string | null;
  isEggless: boolean;
}

export async function getMyFavourites(): Promise<FavouriteProduct[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("wishlist_items")
    .select(
      `product_id,
       products(id, slug, name, base_price_paise, is_eggless,
                categories(route_segment),
                product_images(url, position))`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getMyFavourites: ${error.message}`);

  return (data ?? [])
    .map((row) => row.products)
    .filter((product): product is NonNullable<typeof product> => Boolean(product))
    .map((product) => {
      const primary = [...(product.product_images ?? [])].sort(
        (a, b) => a.position - b.position,
      )[0];

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        base_price_paise: product.base_price_paise,
        routeSegment: product.categories?.route_segment ?? "cake",
        imageUrl: primary?.url ?? null,
        isEggless: product.is_eggless,
      };
    });
}
