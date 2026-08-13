import Link from "next/link";
import { ProductCard } from "@/components/site/ProductCard";
import type { CatalogProduct } from "@/types/bakingo";

interface RelatedRailProps {
  products: CatalogProduct[];
  heading?: string;
  viewAllHref?: string;
}

/**
 * `.more-prods-container` on a product detail page — "You may also like".
 * Reuses the 249px homepage card; the rail scrolls horizontally.
 */
export function RelatedRail({
  products,
  heading = "You may also like",
  viewAllHref = "/best-seller",
}: RelatedRailProps) {
  if (!products.length) return null;

  return (
    <section className="w-full py-[32px] md:py-[40px]">
      <div className="mx-auto w-full max-w-[1296px] px-[16px] md:px-[20px] lg:px-0">
        <div className="mb-[20px] flex items-baseline justify-between">
          <h2 className="text-[20px] leading-[24px] font-semibold text-[#070707] md:text-[24px] md:leading-[28px]">
            {heading}
          </h2>
          <Link
            href={viewAllHref}
            className="text-[14px] font-semibold text-[#fc0015] underline md:text-[16px]"
          >
            View All
          </Link>
        </div>

        <div className="flex gap-[16px] overflow-x-auto no-scrollbar md:gap-[29px]">
          {products.map((product) => (
            <ProductCard
              key={product.slug}
              card={{
                name: product.name,
                href: product.href,
                image: product.image,
                alt: product.alt,
                price: product.price,
                rating: product.rating,
                reviews: product.reviews,
                eggless: product.eggless,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
