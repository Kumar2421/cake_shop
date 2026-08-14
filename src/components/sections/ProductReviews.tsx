import Image from "next/image";
import type { ProductWithRelations } from "@/types/db";

/**
 * `.review-rating-container` on a product detail page.
 *
 * The aggregate figures are the product's own rating and review count; the
 * thumbnail strip reuses the product gallery, which is what the target shows
 * when a SKU has no customer photos of its own.
 */
export function ProductReviews({ product }: { product: ProductWithRelations }) {
  const thumbnails = product.product_images.slice(0, 5);
  const overflow = Math.max(0, product.product_images.length - thumbnails.length);
  const formattedRating = product.rating !== null ? product.rating.toFixed(1) : "N/A";
  const reviewsDisplay = product.review_count > 999
    ? `${(product.review_count / 1000).toFixed(1)}K`
    : product.review_count.toString();

  return (
    <section className="mt-[32px] w-full">
      <h2 className="text-[18px] leading-[22px] font-semibold text-[#070707] md:text-[20px] md:leading-[24px]">
        Ratings &amp; Reviews
      </h2>

      <div className="mt-[12px] flex items-center gap-[8px]">
        <span className="text-[24px] leading-[28px] font-semibold text-[#070707]">
          {formattedRating}
          <span className="text-[16px] text-[#515151]">/5</span>
        </span>
        <span className="text-[16px] text-[#00a651]">★</span>
        <span className="text-[13px] font-semibold tracking-[-0.15px] text-[#515151]">
          ({reviewsDisplay} Reviews)
        </span>
      </div>

      <div className="mt-[16px] flex items-center gap-[10px]">
        {thumbnails.map((image, index) => (
          <div
            key={image.id}
            className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[7px]"
          >
            <Image
              src={image.url}
              alt={`${product.name} review photo ${index + 1}`}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
        ))}
        {overflow > 0 ? (
          <span className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-[7px] bg-[#fff5ee] text-[14px] font-semibold text-[#fc0015]">
            +{overflow}
          </span>
        ) : null}
      </div>
    </section>
  );
}
