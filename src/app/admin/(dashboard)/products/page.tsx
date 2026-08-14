import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { ProductsListContent } from "@/components/admin/products/ProductsList";

export const metadata = {
  title: "Products | Admin",
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Products</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Manage your product catalog
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="gap-2">
            <Plus className="size-4" />
            New product
          </Button>
        </Link>
      </div>

      {/* Products list */}
      <Suspense fallback={<div className="text-center text-ink-muted">Loading products...</div>}>
        <ProductsListContent
          search={params.q}
          categoryId={params.category ? Number(params.category) : undefined}
          page={params.page ? Number(params.page) : 1}
        />
      </Suspense>
    </div>
  );
}
