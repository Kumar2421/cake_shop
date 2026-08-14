import { getProducts } from "@/lib/queries/products";
import { ProductGridClient } from "@/components/sections/ProductGridClient";

interface ProductGridProps {
  bestsellersOnly?: boolean;
  initialFlavour?: string;
  initialSort?: "popular" | "price_asc" | "price_desc" | "rating";
}

export async function ProductGrid({
  bestsellersOnly,
  initialFlavour,
  initialSort = "popular",
}: ProductGridProps) {
  const { products } = await getProducts({
    bestsellersOnly,
    flavour: initialFlavour,
    sort: initialSort,
  });

  return (
    <ProductGridClient
      initialProducts={products}
      bestsellersOnly={bestsellersOnly}
      initialFlavour={initialFlavour}
      initialSort={initialSort}
    />
  );
}
