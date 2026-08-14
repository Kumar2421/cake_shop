import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/products/ProductForm";
import type { CategoryRow } from "@/types/db";

export const metadata = {
  title: "New Product | Admin",
};

export default async function NewProductPage() {
  await requireAdmin();

  // Fetch categories for the form select
  const client = await createClient();
  const { data: categories } = await client
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("position");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Create Product</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Add a new product to your catalog
        </p>
      </div>

      <ProductForm categories={categories as CategoryRow[] | null} />
    </div>
  );
}
