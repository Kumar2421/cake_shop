import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { CategoriesClient } from "@/components/admin/categories/CategoriesClient";

export const metadata = {
  title: "Categories | Admin",
};

export default async function CategoriesPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Categories</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Organize your products into categories and subcategories.
        </p>
      </div>

      <Suspense fallback={<div className="text-sm text-ink-muted">Loading categories...</div>}>
        <CategoriesClient />
      </Suspense>
    </div>
  );
}
