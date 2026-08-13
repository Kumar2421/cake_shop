/**
 * Seeds Supabase from the static content in src/data/.
 *
 *   npm run seed
 *
 * Idempotent: every write is an upsert keyed on a natural unique column, so
 * re-running updates rows instead of duplicating them.
 *
 * Images stay in /public/images and are referenced by path. Supabase Storage is
 * reserved for images uploaded later through the admin dashboard.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

import { catalog } from "../src/data/catalog";
import { navItems } from "../src/data/header";
import type { Database } from "../src/types/database";
import type { CatalogProduct } from "../src/types/bakingo";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const db = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------- parsing

/** "₹549" -> 54900 paise. */
function toPaise(price: string): number {
  const rupees = Number(price.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(rupees)) throw new Error(`Unparseable price: ${price}`);
  return Math.round(rupees * 100);
}

/** "8.8K" -> 8800, "193" -> 193. */
function toReviewCount(reviews: string): number {
  const raw = reviews.replace(/[(),\s]/g, "");
  const match = raw.match(/^([\d.]+)([KkMm]?)/);
  if (!match) return 0;
  const n = Number(match[1]);
  const mult = match[2].toLowerCase() === "k" ? 1_000 : match[2].toLowerCase() === "m" ? 1_000_000 : 1;
  return Math.round(n * mult);
}

/** "0.5 Kg" -> 0.5. */
function toKg(label: string): number {
  const match = label.match(/([\d.]+)\s*kg/i);
  return match ? Number(match[1]) : 0.5;
}

/**
 * The source listing only exposes the entry price (the smallest weight).
 * Larger weights scale close to linearly with a small bulk discount, which is
 * how the real shop prices them. Rounded to whole rupees.
 * Admins can override any variant price afterwards.
 */
function variantPrice(basePaise: number, baseKg: number, kg: number): number {
  const factor = kg / baseKg;
  const bulkDiscount = Math.min(0.12, 0.03 * (factor - 1));
  const paise = basePaise * factor * (1 - bulkDiscount);
  return Math.round(paise / 100) * 100;
}

/** Best-effort flavour tag, used by the storefront filter chips. */
const FLAVOURS = [
  "Chocolate", "Butterscotch", "Pineapple", "Vanilla", "Red Velvet", "Fruit",
  "Blueberry", "Strawberry", "Mango", "Coffee", "Rasmalai", "Blackforest",
  "Caramel", "Cheese",
];

function detectFlavour(product: CatalogProduct): string | null {
  const haystack = `${product.name} ${product.description}`.toLowerCase();
  return FLAVOURS.find((f) => haystack.includes(f.toLowerCase())) ?? null;
}

// ------------------------------------------------------------- categories

/** Title-cases a route segment: "theme-cake" -> "Theme Cake". */
function humanise(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

async function seedCategories() {
  // Top level comes from the mega-menu; leaves come from the catalog's own
  // route segments so every product has a home.
  const topLevel = navItems.map((item, index) => ({
    slug: (item.href ?? `/${item.label.toLowerCase().replace(/\s+/g, "-")}`).replace(/^\//, "") || "cakes",
    name: item.label,
    route_segment: null as string | null,
    position: index,
  }));

  const productSegments = [...new Set(catalog.map((p) => p.category))];
  const leaves = productSegments.map((segment, index) => ({
    slug: segment,
    name: humanise(segment),
    route_segment: segment,
    position: topLevel.length + index,
  }));

  // Dedupe by slug, preferring the leaf definition (it carries route_segment).
  const bySlug = new Map<string, (typeof topLevel)[number]>();
  for (const row of [...topLevel, ...leaves]) bySlug.set(row.slug, row);

  const { error } = await db
    .from("categories")
    .upsert([...bySlug.values()], { onConflict: "slug" });

  if (error) throw error;

  const { data } = await db.from("categories").select("id, slug");
  return new Map((data ?? []).map((c) => [c.slug, c.id]));
}

// --------------------------------------------------------------- products

async function seedProducts(categoryIds: Map<string, number>) {
  const rows = catalog.map((p) => ({
    category_id: categoryIds.get(p.category) ?? null,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    description: p.description || null,
    chef_word: p.chefWord || null,
    base_price_paise: toPaise(p.price),
    price_note: p.priceNote || null,
    rating: p.rating ? Number(p.rating) : null,
    review_count: toReviewCount(p.reviews),
    is_eggless: p.eggless,
    tag: p.tag || null,
    flavour: detectFlavour(p),
    is_bestseller: /best\s*seller/i.test(p.tag ?? ""),
    is_active: true,
  }));

  const { error } = await db.from("products").upsert(rows, { onConflict: "slug" });
  if (error) throw error;

  const { data } = await db.from("products").select("id, slug");
  return new Map((data ?? []).map((p) => [p.slug, p.id]));
}

async function seedVariantsAndImages(productIds: Map<string, number>) {
  const variants: Database["public"]["Tables"]["product_variants"]["Insert"][] = [];
  const images: Database["public"]["Tables"]["product_images"]["Insert"][] = [];

  for (const product of catalog) {
    const productId = productIds.get(product.slug);
    if (!productId) continue;

    const basePaise = toPaise(product.price);
    const weights = product.weights.length ? product.weights : [{ label: "0.5 Kg", serving: "" }];
    const baseKg = toKg(weights[0].label);

    weights.forEach((weight, index) => {
      const kg = toKg(weight.label);
      variants.push({
        product_id: productId,
        weight_label: weight.label,
        serving_label: weight.serving || null,
        price_paise: index === 0 ? basePaise : variantPrice(basePaise, baseKg, kg),
        sku: `${product.sku}-${weight.label.replace(/[^\w.]/g, "").toLowerCase()}`,
        position: index,
        is_active: true,
      });
    });

    const gallery = product.gallery.length ? product.gallery : [product.image];
    gallery.forEach((url, index) => {
      images.push({ product_id: productId, url, alt: product.alt, position: index });
    });
  }

  // Images have no natural unique key, so replace the set for these products.
  const productIdList = [...productIds.values()];
  const { error: deleteError } = await db
    .from("product_images")
    .delete()
    .in("product_id", productIdList);
  if (deleteError) throw deleteError;

  const { error: imageError } = await db.from("product_images").insert(images);
  if (imageError) throw imageError;

  const { error: variantError } = await db
    .from("product_variants")
    .upsert(variants, { onConflict: "product_id,weight_label" });
  if (variantError) throw variantError;

  return { variants: variants.length, images: images.length };
}

// --------------------------------------------------------------- delivery

const COIMBATORE_PINCODES = [
  "641001", "641002", "641004", "641006", "641009", "641011", "641012",
  "641014", "641018", "641025", "641028", "641035", "641037", "641045",
];

async function seedDelivery() {
  const areas = COIMBATORE_PINCODES.map((pincode) => ({
    pincode,
    city: "Coimbatore",
    is_serviceable: true,
    supports_same_day: true,
    delivery_fee_paise: 0,
  }));

  const { error: areaError } = await db
    .from("delivery_areas")
    .upsert(areas, { onConflict: "pincode" });
  if (areaError) throw areaError;

  const slots = [
    { label: "9 AM - 12 PM", start_time: "09:00", end_time: "12:00", surcharge_paise: 0, position: 0 },
    { label: "12 PM - 3 PM", start_time: "12:00", end_time: "15:00", surcharge_paise: 0, position: 1 },
    { label: "3 PM - 6 PM", start_time: "15:00", end_time: "18:00", surcharge_paise: 0, position: 2 },
    { label: "6 PM - 9 PM", start_time: "18:00", end_time: "21:00", surcharge_paise: 0, position: 3 },
    { label: "Midnight (11 PM - 11:59 PM)", start_time: "23:00", end_time: "23:59", surcharge_paise: 25_000, position: 4 },
  ];

  // Slots have no natural key; clear and reinsert so labels stay in sync.
  const { data: existing } = await db.from("delivery_slots").select("id");
  if (existing?.length) {
    await db.from("delivery_slots").delete().in("id", existing.map((s) => s.id));
  }
  const { error: slotError } = await db.from("delivery_slots").insert(slots);
  if (slotError) throw slotError;

  return { areas: areas.length, slots: slots.length };
}

// ------------------------------------------------------------------- main

async function main() {
  console.log("Seeding Supabase...");

  const categoryIds = await seedCategories();
  console.log(`  categories       ${categoryIds.size}`);

  const productIds = await seedProducts(categoryIds);
  console.log(`  products         ${productIds.size}`);

  const { variants, images } = await seedVariantsAndImages(productIds);
  console.log(`  variants         ${variants}`);
  console.log(`  images           ${images}`);

  const { areas, slots } = await seedDelivery();
  console.log(`  delivery areas   ${areas}`);
  console.log(`  delivery slots   ${slots}`);

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
