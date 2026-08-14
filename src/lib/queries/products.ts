import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProductImageRow, ProductVariantRow, ProductWithRelations } from "@/types/db";

/** Product card needs: id, slug, name, price, rating/count, eggless, tag, flavour, category route_segment, and primary image. */
export interface ProductListItem {
  id: number;
  slug: string;
  name: string;
  base_price_paise: number;
  rating: number | null;
  review_count: number;
  is_eggless: boolean;
  tag: string | null;
  flavour: string | null;
  categoryRouteSegment: string | null;
  primaryImage: {
    url: string;
    alt: string | null;
  };
}

/** Raw shape from nested query in getProducts/getRelatedProducts/getBestsellers. */
interface ProductListRow {
  id: number;
  slug: string;
  name: string;
  base_price_paise: number;
  rating: number | null;
  review_count: number;
  is_eggless: boolean;
  tag: string | null;
  flavour: string | null;
  categories: { route_segment: string | null } | null;
  product_images: Array<{ url: string; alt: string | null; position: number }>;
}

/**
 * Fetch products with filtering and pagination.
 * Supports category filtering via slug, flavour, bestseller flag, full-text search, and sorting.
 * Returns paginated results via range-based pagination (offset/limit).
 */
export async function getProducts(options?: {
  categorySlug?: string;
  flavour?: string;
  bestsellersOnly?: boolean;
  search?: string;
  sort?: "popular" | "price_asc" | "price_desc" | "rating";
  limit?: number;
  offset?: number;
}): Promise<{ products: ProductListItem[]; total: number }> {
  const client = await createClient();
  const limit = options?.limit ?? 12;
  const offset = options?.offset ?? 0;

  try {
    // Start with base query to get count + data in one pass
    let query = client
      .from("products")
      .select(
        `
        id,
        slug,
        name,
        base_price_paise,
        rating,
        review_count,
        is_eggless,
        tag,
        flavour,
        categories!inner(route_segment),
        product_images(url, alt, position)
        `,
        { count: "exact" },
      )
      .eq("is_active", true);

    // Filter by category slug if provided
    if (options?.categorySlug) {
      query = query.eq("categories.slug", options.categorySlug);
    }

    // Filter by flavour if provided
    if (options?.flavour) {
      query = query.eq("flavour", options.flavour);
    }

    // Filter to bestsellers only if requested
    if (options?.bestsellersOnly) {
      query = query.eq("is_bestseller", true);
    }

    // Full-text search via search_vector if provided
    if (options?.search) {
      query = query.textSearch("search_vector", options.search);
    }

    // Apply sorting
    switch (options?.sort) {
      case "price_asc":
        query = query.order("base_price_paise", { ascending: true });
        break;
      case "price_desc":
        query = query.order("base_price_paise", { ascending: false });
        break;
      case "rating":
        query = query.order("rating", { ascending: false, nullsFirst: false });
        break;
      case "popular":
      default:
        // Popular: sort by is_bestseller desc, then review_count desc
        query = query.order("is_bestseller", { ascending: false }).order("review_count", { ascending: false });
    }

    // Apply pagination
    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`getProducts: ${error.message}`);
    }

    // Transform rows to ProductListItem, extracting primary image
    const products: ProductListItem[] = (data ?? []).map((row: ProductListRow) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      base_price_paise: row.base_price_paise,
      rating: row.rating,
      review_count: row.review_count,
      is_eggless: row.is_eggless,
      tag: row.tag,
      flavour: row.flavour,
      categoryRouteSegment: row.categories?.route_segment ?? null,
      primaryImage: {
        url: row.product_images?.[0]?.url ?? "",
        alt: row.product_images?.[0]?.alt ?? null,
      },
    }));

    return {
      products,
      total: count ?? 0,
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error(`getProducts: Unknown error`);
  }
}

/**
 * Fetch a single product by slug with all relations.
 * Returns the full ProductWithRelations shape: product + images + variants + category.
 */
export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  const client = await createClient();

  try {
    const { data, error } = await client
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        base_price_paise,
        category_id,
        description,
        chef_word,
        is_eggless,
        is_bestseller,
        is_active,
        rating,
        review_count,
        tag,
        flavour,
        price_note,
        sku,
        created_at,
        updated_at,
        search_vector,
        product_images(id, product_id, url, alt, position),
        product_variants(id, product_id, weight_label, serving_label, price_paise, is_active, position, sku, stock),
        categories!inner(id, name, slug, route_segment)
        `,
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      throw new Error(`getProductBySlug: ${error.message}`);
    }

    // Sort images and variants by position
    data.product_images.sort((a: ProductImageRow, b: ProductImageRow) => a.position - b.position);
    data.product_variants.sort((a: ProductVariantRow, b: ProductVariantRow) => a.position - b.position);

    return data as ProductWithRelations;
  } catch (error) {
    throw error instanceof Error ? error : new Error(`getProductBySlug: Unknown error`);
  }
}

/**
 * Fetch related products from the same category, excluding the given product.
 * Used for "You may also like" sections on detail pages.
 */
export async function getRelatedProducts(
  productId: number,
  categoryId: number | null,
  limit = 6,
): Promise<ProductListItem[]> {
  if (!categoryId) {
    return [];
  }

  const client = await createClient();

  try {
    const { data, error } = await client
      .from("products")
      .select(
        `
        id,
        slug,
        name,
        base_price_paise,
        rating,
        review_count,
        is_eggless,
        tag,
        flavour,
        categories!inner(route_segment),
        product_images(url, alt, position)
        `,
      )
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .neq("id", productId)
      .order("is_bestseller", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`getRelatedProducts: ${error.message}`);
    }

    const products: ProductListItem[] = (data ?? []).map((row: ProductListRow) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      base_price_paise: row.base_price_paise,
      rating: row.rating,
      review_count: row.review_count,
      is_eggless: row.is_eggless,
      tag: row.tag,
      flavour: row.flavour,
      categoryRouteSegment: row.categories?.route_segment ?? null,
      primaryImage: {
        url: row.product_images?.[0]?.url ?? "",
        alt: row.product_images?.[0]?.alt ?? null,
      },
    }));

    return products;
  } catch (error) {
    throw error instanceof Error ? error : new Error(`getRelatedProducts: Unknown error`);
  }
}

/**
 * Fetch bestselling products.
 * Ordered by review_count descending for popularity.
 */
export async function getBestsellers(limit = 8): Promise<ProductListItem[]> {
  const client = await createClient();

  try {
    const { data, error } = await client
      .from("products")
      .select(
        `
        id,
        slug,
        name,
        base_price_paise,
        rating,
        review_count,
        is_eggless,
        tag,
        flavour,
        categories!inner(route_segment),
        product_images(url, alt, position)
        `,
      )
      .eq("is_active", true)
      .eq("is_bestseller", true)
      .order("review_count", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`getBestsellers: ${error.message}`);
    }

    const products: ProductListItem[] = (data ?? []).map((row: ProductListRow) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      base_price_paise: row.base_price_paise,
      rating: row.rating,
      review_count: row.review_count,
      is_eggless: row.is_eggless,
      tag: row.tag,
      flavour: row.flavour,
      categoryRouteSegment: row.categories?.route_segment ?? null,
      primaryImage: {
        url: row.product_images?.[0]?.url ?? "",
        alt: row.product_images?.[0]?.alt ?? null,
      },
    }));

    return products;
  } catch (error) {
    throw error instanceof Error ? error : new Error(`getBestsellers: Unknown error`);
  }
}
