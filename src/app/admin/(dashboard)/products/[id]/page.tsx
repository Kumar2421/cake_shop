import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getProductForEdit } from "@/lib/admin/products";
import { ProductForm } from "@/components/admin/products/ProductForm";
import type { CategoryRow } from "@/types/db";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    title: `Edit Product #${id} | Admin`,
  };
}

export default async function EditProductPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  const productId = Number(id);
  if (Number.isNaN(productId)) {
    notFound();
  }

  // Fetch product and categories in parallel
  const [product, categoriesResult] = await Promise.all([
    getProductForEdit(productId),
    (async () => {
      const client = await createClient();
      return client
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("position");
    })(),
  ]);

  if (!product) {
    notFound();
  }

  const categories = categoriesResult.data as CategoryRow[] | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Edit Product</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {product.name}
        </p>
      </div>

      <ProductForm
        product={product}
        categories={categories}
      />
    </div>
  );
}
