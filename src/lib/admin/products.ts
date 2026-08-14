"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ProductRow,
  ProductImageRow,
  ProductVariantRow,
  ProductWithRelations,
} from "@/types/db";

type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
};

// Validation schemas
const productBaseSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  sku: z.string().min(1, "SKU is required").max(100),
  category_id: z.coerce.number().nullable(),
  description: z.string().nullable(),
  chef_word: z.string().nullable(),
  base_price_rupees: z.coerce.number().min(0, "Price must be non-negative"),
  is_eggless: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
  is_active: z.boolean().default(true),
  tag: z.string().nullable(),
  flavour: z.string().nullable(),
});

const variantSchema = z.object({
  id: z.coerce.number().optional(),
  weight_label: z.string().min(1, "Weight label is required"),
  serving_label: z.string().nullable(),
  price_rupees: z.coerce.number().min(0, "Variant price must be non-negative"),
  sku: z.string().nullable(),
  stock: z.coerce.number().nullable(),
  is_active: z.boolean().default(true),
  position: z.coerce.number().default(0),
});

/**
 * Fetch a product by ID with all relations for the edit form.
 */
export async function getProductForEdit(
  id: number,
): Promise<ProductWithRelations | null> {
  await requireAdmin();
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
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`getProductForEdit: ${error.message}`);
    }

    // Sort images and variants by position
    data.product_images.sort(
      (a: ProductImageRow, b: ProductImageRow) => a.position - b.position,
    );
    data.product_variants.sort(
      (a: ProductVariantRow, b: ProductVariantRow) => a.position - b.position,
    );

    return data as ProductWithRelations;
  } catch (error) {
    throw error instanceof Error ? error : new Error("getProductForEdit: Unknown error");
  }
}

/**
 * Get paginated products for the admin list view.
 */
export async function getAdminProducts(options?: {
  search?: string;
  category_id?: number;
  page?: number;
  limit?: number;
}): Promise<{
  products: (ProductRow & { variant_count: number; primary_image: ProductImageRow | null })[];
  total: number;
}> {
  await requireAdmin();
  const client = await createClient();

  const limit = options?.limit ?? 20;
  const offset = ((options?.page ?? 1) - 1) * limit;

  try {
    let query = client
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        base_price_paise,
        category_id,
        is_eggless,
        is_active,
        is_bestseller,
        sku,
        created_at,
        updated_at,
        product_variants(id),
        product_images(id, product_id, url, alt, position)
        `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (options?.search) {
      query = query.or(
        `name.ilike.%${options.search}%,sku.ilike.%${options.search}%`,
      );
    }

    if (options?.category_id) {
      query = query.eq("category_id", options.category_id);
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`getAdminProducts: ${error.message}`);
    }

    const products = (data as Array<
      ProductRow & {
        product_variants: Array<{ id: number }>;
        product_images: ProductImageRow[];
      }
    >).map((row) => ({
      ...row,
      variant_count: row.product_variants?.length ?? 0,
      primary_image: row.product_images?.[0] ?? null,
    }));

    return {
      products,
      total: count ?? 0,
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error("getAdminProducts: Unknown error");
  }
}

/**
 * Create a new product.
 */
export async function createProduct(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  try {
    const raw = Object.fromEntries(formData);

    // Parse base product fields
    const baseData = productBaseSchema.parse(raw);

    // Convert rupees to paise
    const base_price_paise = Math.round(baseData.base_price_rupees * 100);

    // Parse variants from array-like formData keys
    const variants: z.infer<typeof variantSchema>[] = [];
    let variantIndex = 0;
    while (formData.has(`variants.${variantIndex}.weight_label`)) {
      const weightLabel = formData.get(
        `variants.${variantIndex}.weight_label`,
      );
      const servingLabel = formData.get(
        `variants.${variantIndex}.serving_label`,
      );
      const priceRupees = formData.get(
        `variants.${variantIndex}.price_rupees`,
      );
      const sku = formData.get(`variants.${variantIndex}.sku`);
      const stock = formData.get(`variants.${variantIndex}.stock`);

      const variant = {
        weight_label: String(weightLabel),
        serving_label: servingLabel ? String(servingLabel) : null,
        price_rupees: Number(priceRupees) || 0,
        sku: sku ? String(sku) : null,
        stock: stock ? Number(stock) : null,
        is_active: formData.get(
          `variants.${variantIndex}.is_active`,
        ) === "on",
        position: variantIndex,
      };
      variants.push(variant);
      variantIndex++;
    }

    if (variants.length === 0) {
      return {
        error: "At least one variant is required",
      };
    }

    const validatedVariants = z.array(variantSchema).parse(variants);

    const client = await createClient();

    // Insert product
    const { data: product, error: productError } = await client
      .from("products")
      .insert([
        {
          name: baseData.name,
          slug: baseData.slug,
          sku: baseData.sku,
          category_id: baseData.category_id,
          description: baseData.description,
          chef_word: baseData.chef_word,
          base_price_paise,
          is_eggless: baseData.is_eggless,
          is_bestseller: baseData.is_bestseller,
          is_active: baseData.is_active,
          tag: baseData.tag,
          flavour: baseData.flavour,
        },
      ])
      .select()
      .single();

    if (productError) {
      return {
        error: `Failed to create product: ${productError.message}`,
      };
    }

    // Insert variants
    const variantInserts = validatedVariants.map((v, idx) => ({
      product_id: product.id,
      weight_label: v.weight_label,
      serving_label: v.serving_label,
      price_paise: Math.round(v.price_rupees * 100),
      sku: v.sku,
      stock: v.stock,
      is_active: v.is_active,
      position: idx,
    }));

    const { error: variantError } = await client
      .from("product_variants")
      .insert(variantInserts);

    if (variantError) {
      // Rollback product creation
      await client.from("products").delete().eq("id", product.id);
      return {
        error: `Failed to create variants: ${variantError.message}`,
      };
    }

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach((err: z.ZodIssue) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });
      return { fieldErrors };
    }

    return {
      error: error instanceof Error ? error.message : "Unknown error creating product",
    };
  }
}

/**
 * Update an existing product.
 */
export async function updateProduct(
  _prev: FormState,
  formData: FormData,
  productId: number,
): Promise<FormState> {
  await requireAdmin();

  try {
    const raw = Object.fromEntries(formData);

    const baseData = productBaseSchema.parse(raw);
    const base_price_paise = Math.round(baseData.base_price_rupees * 100);

    // Parse variants
    const variants: z.infer<typeof variantSchema>[] = [];
    let variantIndex = 0;
    while (formData.has(`variants.${variantIndex}.weight_label`)) {
      const weightLabel = formData.get(
        `variants.${variantIndex}.weight_label`,
      );
      const servingLabel = formData.get(
        `variants.${variantIndex}.serving_label`,
      );
      const priceRupees = formData.get(
        `variants.${variantIndex}.price_rupees`,
      );
      const sku = formData.get(`variants.${variantIndex}.sku`);
      const stock = formData.get(`variants.${variantIndex}.stock`);
      const id = formData.get(`variants.${variantIndex}.id`);

      const variant = {
        id: id ? Number(id) : undefined,
        weight_label: String(weightLabel),
        serving_label: servingLabel ? String(servingLabel) : null,
        price_rupees: Number(priceRupees) || 0,
        sku: sku ? String(sku) : null,
        stock: stock ? Number(stock) : null,
        is_active: formData.get(
          `variants.${variantIndex}.is_active`,
        ) === "on",
        position: variantIndex,
      };
      variants.push(variant);
      variantIndex++;
    }

    if (variants.length === 0) {
      return {
        error: "At least one variant is required",
      };
    }

    const validatedVariants = z.array(variantSchema).parse(variants);

    const client = await createClient();

    // Update product
    const { error: updateError } = await client
      .from("products")
      .update({
        name: baseData.name,
        slug: baseData.slug,
        sku: baseData.sku,
        category_id: baseData.category_id,
        description: baseData.description,
        chef_word: baseData.chef_word,
        base_price_paise,
        is_eggless: baseData.is_eggless,
        is_bestseller: baseData.is_bestseller,
        is_active: baseData.is_active,
        tag: baseData.tag,
        flavour: baseData.flavour,
      })
      .eq("id", productId);

    if (updateError) {
      return {
        error: `Failed to update product: ${updateError.message}`,
      };
    }

    // Handle variant updates: delete removed ones, update existing, insert new
    const existingVariantIds = new Set(
      validatedVariants
        .filter((v) => v.id !== undefined)
        .map((v) => v.id as number),
    );

    // Get current variants
    const { data: currentVariants, error: fetchError } = await client
      .from("product_variants")
      .select("id")
      .eq("product_id", productId);

    if (fetchError) {
      return {
        error: `Failed to fetch current variants: ${fetchError.message}`,
      };
    }

    // Delete variants that are no longer present
    const variantsToDelete = (currentVariants ?? [])
      .map((v: { id: number }) => v.id)
      .filter((id: number) => !existingVariantIds.has(id));

    if (variantsToDelete.length > 0) {
      const { error: deleteError } = await client
        .from("product_variants")
        .delete()
        .in("id", variantsToDelete);

      if (deleteError) {
        return {
          error: `Failed to delete variants: ${deleteError.message}`,
        };
      }
    }

    // Upsert variants
    const variantUpserts = validatedVariants.map((v, idx) => {
      const upsert: Record<string, string | number | boolean | null> = {
        product_id: productId,
        weight_label: v.weight_label,
        serving_label: v.serving_label,
        price_paise: Math.round(v.price_rupees * 100),
        sku: v.sku,
        stock: v.stock,
        is_active: v.is_active,
        position: idx,
      };

      if (v.id !== undefined) {
        upsert.id = v.id;
      }

      return upsert;
    });

    const { error: upsertError } = await client
      .from("product_variants")
      .upsert(variantUpserts as never, { onConflict: "id" });

    if (upsertError) {
      return {
        error: `Failed to upsert variants: ${upsertError.message}`,
      };
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach((err: z.ZodIssue) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });
      return { fieldErrors };
    }

    return {
      error: error instanceof Error ? error.message : "Unknown error updating product",
    };
  }
}

/**
 * Soft delete a product (set is_active=false).
 * Hard delete is avoided because order_items reference products.
 * Changing order history would destroy audit trails.
 */
export async function deleteProduct(id: number): Promise<FormState> {
  await requireAdmin();

  try {
    const client = await createClient();

    const { error } = await client
      .from("products")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      return {
        error: `Failed to delete product: ${error.message}`,
      };
    }

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error deleting product",
    };
  }
}

/**
 * Delete a single product variant.
 */
export async function deleteVariant(variantId: number): Promise<FormState> {
  await requireAdmin();

  try {
    const client = await createClient();

    const { error } = await client
      .from("product_variants")
      .delete()
      .eq("id", variantId);

    if (error) {
      return {
        error: `Failed to delete variant: ${error.message}`,
      };
    }

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error deleting variant",
    };
  }
}

/**
 * Delete a product image.
 */
export async function deleteImage(imageId: number): Promise<FormState> {
  await requireAdmin();

  try {
    const client = await createClient();

    // First get the image URL to delete from storage
    const { data: image, error: fetchError } = await client
      .from("product_images")
      .select("url")
      .eq("id", imageId)
      .single();

    if (fetchError) {
      return {
        error: `Failed to fetch image: ${fetchError.message}`,
      };
    }

    // Delete from storage
    const admin = createAdminClient();
    const fileName = image.url.split("/").pop();
    if (fileName) {
      await admin.storage.from("product-images").remove([fileName]);
    }

    // Delete from database
    const { error: deleteError } = await client
      .from("product_images")
      .delete()
      .eq("id", imageId);

    if (deleteError) {
      return {
        error: `Failed to delete image record: ${deleteError.message}`,
      };
    }

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error deleting image",
    };
  }
}

/**
 * Reorder product images based on new positions.
 */
export async function reorderImages(
  imageIds: number[],
): Promise<FormState> {
  await requireAdmin();

  try {
    const client = await createClient();

    // Update position for each image
    for (let idx = 0; idx < imageIds.length; idx++) {
      const { error } = await client
        .from("product_images")
        .update({ position: idx })
        .eq("id", imageIds[idx]);

      if (error) {
        return {
          error: `Failed to reorder images: ${error.message}`,
        };
      }
    }

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error reordering images",
    };
  }
}

/**
 * Get a signed upload URL for product images to the product-images bucket.
 * The URL is valid for 1 hour and allows direct browser uploads.
 */
export async function getProductImageUploadUrl(fileName: string): Promise<{
  url?: string;
  path?: string;
  error?: string;
}> {
  await requireAdmin();

  try {
    const admin = createAdminClient();

    // Generate a unique file name with timestamp
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueName = `${timestamp}_${safeName}`;

    const { data, error } = await admin.storage
      .from("product-images")
      .createSignedUploadUrl(uniqueName, {
        upsert: false,
      });

    if (error) {
      return {
        error: `Failed to generate upload URL: ${error.message}`,
      };
    }

    return {
      url: data.signedUrl,
      path: uniqueName,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error generating upload URL",
    };
  }
}

/**
 * After a successful upload to product-images, create the database record.
 */
export async function createImageRecord(
  productId: number,
  imageUrl: string,
  alt?: string,
): Promise<FormState> {
  await requireAdmin();

  try {
    const client = await createClient();

    // Get max position for this product
    const { data: images, error: fetchError } = await client
      .from("product_images")
      .select("position")
      .eq("product_id", productId)
      .order("position", { ascending: false })
      .limit(1);

    if (fetchError && fetchError.code !== "PGRST116") {
      return {
        error: `Failed to fetch images: ${fetchError.message}`,
      };
    }

    const nextPosition = ((images?.[0]?.position ?? -1) + 1);

    const { error: insertError } = await client
      .from("product_images")
      .insert([
        {
          product_id: productId,
          url: imageUrl,
          alt: alt || null,
          position: nextPosition,
        },
      ]);

    if (insertError) {
      return {
        error: `Failed to create image record: ${insertError.message}`,
      };
    }

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error creating image record",
    };
  }
}
