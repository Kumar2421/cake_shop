"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Insert, Update } from "@/types/db";

export interface FormState {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
  data?: unknown;
}

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  slug: z.string().min(1, "Slug is required").max(255, "Slug must be less than 255 characters"),
  parentId: z.number().nullable(),
  routeSegment: z.string().nullable(),
  imageUrl: z.string().url("Image URL must be valid").nullable(),
  position: z.number().int().nonnegative("Position must be non-negative"),
  isActive: z.boolean(),
});

const updateCategorySchema = createCategorySchema.extend({
  id: z.number().positive("Category ID must be positive"),
});

export async function createCategory(input: z.infer<typeof createCategorySchema>): Promise<FormState> {
  await requireAdmin();

  const validationResult = createCategorySchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors as Record<string, string>,
      message: "Validation failed",
    };
  }

  try {
    const admin = createAdminClient();
    const data = validationResult.data;

    const { data: category, error } = await admin
      .from("categories")
      .insert({
        name: data.name,
        slug: data.slug,
        parent_id: data.parentId,
        route_segment: data.routeSegment,
        image_url: data.imageUrl,
        position: data.position,
        is_active: data.isActive,
      } as Insert<"categories">)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: error.message || "Failed to create category",
      };
    }

    revalidatePath("/admin/categories");

    return {
      success: true,
      message: "Category created successfully",
      data: category,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return {
      success: false,
      message,
    };
  }
}

export async function updateCategory(
  id: number,
  input: z.infer<typeof createCategorySchema>
): Promise<FormState> {
  await requireAdmin();

  const validationResult = updateCategorySchema.safeParse({ id, ...input });

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors as Record<string, string>,
      message: "Validation failed",
    };
  }

  try {
    const admin = createAdminClient();
    const data = validationResult.data;

    const { data: category, error } = await admin
      .from("categories")
      .update({
        name: data.name,
        slug: data.slug,
        parent_id: data.parentId,
        route_segment: data.routeSegment,
        image_url: data.imageUrl,
        position: data.position,
        is_active: data.isActive,
      } as Update<"categories">)
      .eq("id", data.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: error.message || "Failed to update category",
      };
    }

    revalidatePath("/admin/categories");

    return {
      success: true,
      message: "Category updated successfully",
      data: category,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return {
      success: false,
      message,
    };
  }
}

export async function deleteCategory(id: number): Promise<FormState> {
  await requireAdmin();

  try {
    const admin = createAdminClient();

    // Check if category has products or child categories
    const [productsResult, childrenResult] = await Promise.all([
      admin.from("products").select("id", { count: "exact", head: true }).eq("category_id", id),
      admin.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", id),
    ]);

    if ((productsResult.count ?? 0) > 0) {
      return {
        success: false,
        message: `Cannot delete this category because it has ${productsResult.count} product(s). Please move or delete the products first.`,
      };
    }

    if ((childrenResult.count ?? 0) > 0) {
      return {
        success: false,
        message: `Cannot delete this category because it has ${childrenResult.count} subcategory(ies). Please move or delete the subcategories first.`,
      };
    }

    const { error } = await admin.from("categories").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        message: error.message || "Failed to delete category",
      };
    }

    revalidatePath("/admin/categories");

    return {
      success: true,
      message: "Category deleted successfully",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return {
      success: false,
      message,
    };
  }
}

export async function reorderCategory(id: number, position: number): Promise<FormState> {
  await requireAdmin();

  if (!Number.isInteger(position) || position < 0) {
    return {
      success: false,
      message: "Position must be a non-negative integer",
    };
  }

  try {
    const admin = createAdminClient();

    const { error } = await admin
      .from("categories")
      .update({ position })
      .eq("id", id);

    if (error) {
      return {
        success: false,
        message: error.message || "Failed to reorder category",
      };
    }

    revalidatePath("/admin/categories");

    return {
      success: true,
      message: "Category position updated successfully",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return {
      success: false,
      message,
    };
  }
}
