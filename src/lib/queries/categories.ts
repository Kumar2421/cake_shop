import "server-only";

// The catalog is world-readable, so these use the cookie-free client.
// Reading cookies would opt every category page out of static rendering for
// data that is identical for every visitor.
import { createStaticClient } from "@/lib/supabase/static";
import type { CategoryRow } from "@/types/db";

/** Category with optional children array for hierarchy. */
export interface CategoryWithChildren extends CategoryRow {
  children?: CategoryWithChildren[];
}

/**
 * Fetch all active categories ordered by position.
 */
export async function getCategories(): Promise<CategoryRow[]> {
  const client = createStaticClient();

  try {
    const { data, error } = await client
      .from("categories")
      .select(
        `
        id,
        name,
        slug,
        route_segment,
        parent_id,
        position,
        is_active,
        image_url,
        created_at
        `,
      )
      .eq("is_active", true)
      .order("position", { ascending: true });

    if (error) {
      throw new Error(`getCategories: ${error.message}`);
    }

    return data ?? [];
  } catch (error) {
    throw error instanceof Error ? error : new Error(`getCategories: Unknown error`);
  }
}

/**
 * Fetch the category hierarchy: top-level categories with children arrays.
 * Built in one query then assembled in memory to avoid N+1.
 */
export async function getCategoryTree(): Promise<CategoryWithChildren[]> {
  const client = createStaticClient();

  try {
    // Fetch all active categories in one query
    const { data, error } = await client
      .from("categories")
      .select(
        `
        id,
        name,
        slug,
        route_segment,
        parent_id,
        position,
        is_active,
        image_url,
        created_at
        `,
      )
      .eq("is_active", true)
      .order("position", { ascending: true });

    if (error) {
      throw new Error(`getCategoryTree: ${error.message}`);
    }

    // Build tree in memory: map by id, then filter top-level and attach children
    const allCategories = data ?? [];
    const categoryMap = new Map<number, CategoryWithChildren>();

    // First pass: populate map
    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: attach children to parents
    const topLevel: CategoryWithChildren[] = [];
    allCategories.forEach((cat) => {
      const catWithChildren = categoryMap.get(cat.id)!;
      if (cat.parent_id === null) {
        topLevel.push(catWithChildren);
      } else {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children ??= [];
          parent.children.push(catWithChildren);
        }
      }
    });

    return topLevel;
  } catch (error) {
    throw error instanceof Error ? error : new Error(`getCategoryTree: Unknown error`);
  }
}

/**
 * Fetch a single category by slug.
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const client = createStaticClient();

  try {
    const { data, error } = await client
      .from("categories")
      .select(
        `
        id,
        name,
        slug,
        route_segment,
        parent_id,
        position,
        is_active,
        image_url,
        created_at
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
      throw new Error(`getCategoryBySlug: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw error instanceof Error ? error : new Error(`getCategoryBySlug: Unknown error`);
  }
}
