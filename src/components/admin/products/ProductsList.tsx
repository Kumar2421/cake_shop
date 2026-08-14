import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  MoreVertical,
  Package,
  Edit,
  Copy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAdminProducts } from "@/lib/admin/products";
import { formatPaise } from "@/types/db";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductDeleteDialog } from "./ProductDeleteDialog";
import { ProductSearchInput } from "./ProductSearchInput";

interface ProductsListContentProps {
  search?: string;
  categoryId?: number;
  page?: number;
}

export async function ProductsListContent({
  search,
  categoryId,
  page = 1,
}: ProductsListContentProps) {
  const { products, total } = await getAdminProducts({
    search,
    category_id: categoryId,
    page,
    limit: 20,
  });

  // Fetch categories for the filter dropdown
  const client = await createClient();
  const { data: categories } = await client
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <ProductSearchInput placeholder="Search by name or SKU..." />
        </div>

        <div className="w-full sm:w-48">
          <form
            action={async (formData) => {
              "use server";
              const catId = formData.get("category");
              if (catId) {
                redirect(`/admin/products?category=${catId}`);
              } else {
                redirect(`/admin/products`);
              }
            }}
          >
            <Select
              name="category"
              defaultValue={categoryId?.toString() ?? ""}
              onValueChange={(value: string | null) => {
                const form = document.querySelector(
                  'form'
                ) as HTMLFormElement;
                if (form) {
                  const input = form.querySelector(
                    'input[name="category"]'
                  ) as HTMLInputElement;
                  if (input) {
                    input.value = value ?? "";
                    form.requestSubmit();
                  }
                }
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories?.map((cat: { id: number; name: string }) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="category" value={categoryId?.toString() ?? ""} />
          </form>
        </div>
      </div>

      {/* Table */}
      {products.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-hairline bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-background">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-center">Variants</TableHead>
                  <TableHead className="text-center">Veg</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    {/* Thumbnail */}
                    <TableCell className="p-2">
                      {product.primary_image ? (
                        <div className="relative h-12 w-12 overflow-hidden rounded">
                          <Image
                            src={product.primary_image.url}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                          <Package className="size-6 text-ink-muted" />
                        </div>
                      )}
                    </TableCell>

                    {/* Name + slug */}
                    <TableCell>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="group"
                      >
                        <div className="font-medium text-ink hover:text-brand-red">
                          {product.name}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {product.slug}
                        </div>
                      </Link>
                    </TableCell>

                    {/* SKU */}
                    <TableCell className="text-sm text-ink-muted">
                      {product.sku}
                    </TableCell>

                    {/* Price */}
                    <TableCell className="text-sm font-medium">
                      {formatPaise(product.base_price_paise)}
                    </TableCell>

                    {/* Variant count */}
                    <TableCell className="text-center text-sm">
                      <span className="inline-flex items-center justify-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-ink">
                        {product.variant_count}
                      </span>
                    </TableCell>

                    {/* Veg indicator */}
                    <TableCell className="text-center">
                      {product.is_eggless ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-green-50 px-2 py-0.5">
                          <span className="text-xs font-medium text-brand-green">
                            Yes
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-ink-muted">No</span>
                      )}
                    </TableCell>

                    {/* Active toggle */}
                    <TableCell className="text-center">
                      <ProductActiveToggle
                        productId={product.id}
                        isActive={product.is_active}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Link href={`/admin/products/${product.id}`} className="flex items-center w-full">
                              <Edit className="mr-2 size-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link
                              href={`/admin/products/${product.id}?duplicate=1`}
                              className="flex items-center w-full"
                            >
                              <Copy className="mr-2 size-4" />
                              Duplicate
                            </Link>
                          </DropdownMenuItem>
                          <ProductDeleteDialog productId={product.id} productName={product.name} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-hairline bg-white p-4">
            <div className="text-sm text-ink-muted">
              Showing{" "}
              <span className="font-medium">
                {startItem}–{endItem}
              </span>{" "}
              of{" "}
              <span className="font-medium">{total}</span> products
            </div>

            <div className="flex gap-2">
              {page > 1 ? (
                <Link href={`/admin/products?page=${page - 1}${search ? `&q=${search}` : ""}${categoryId ? `&category=${categoryId}` : ""}`}>
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
              )}

              <div className="flex items-center gap-1 text-xs text-ink-muted">
                Page {page} of {totalPages}
              </div>

              {page < totalPages ? (
                <Link href={`/admin/products?page=${page + 1}${search ? `&q=${search}` : ""}${categoryId ? `&category=${categoryId}` : ""}`}>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-hairline bg-white p-12 text-center">
          <Package className="mx-auto mb-4 size-12 text-ink-muted" />
          <h3 className="text-lg font-medium text-ink">No products found</h3>
          <p className="mt-2 text-sm text-ink-muted">
            {search || categoryId
              ? "Try adjusting your filters"
              : "Get started by creating your first product"}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Client component for toggling product active status.
 */
function ProductActiveToggle({
  productId,
  isActive,
}: {
  productId: number;
  isActive: boolean;
}) {
  return (
    <form
      action={async () => {
        "use server";
        const { createClient } = await import("@/lib/supabase/server");
        const { revalidatePath } = await import("next/cache");
        const client = await createClient();

        await client
          .from("products")
          .update({ is_active: !isActive })
          .eq("id", productId);

        revalidatePath("/admin/products");
      }}
    >
      <Switch
        checked={isActive}
        onCheckedChange={() => {
          const form = document.querySelector(
            `form[data-product-id="${productId}"]`,
          ) as HTMLFormElement;
          if (form) form.requestSubmit();
        }}
        data-product-id={productId}
      />
    </form>
  );
}
