import Image from "next/image";
import Link from "next/link";
import { HeartIcon } from "@/components/icons";
import { formatPaise } from "@/types/db";
import type { ProductListItem } from "@/lib/queries/products";

/**
 * `.product-card.homepage_product` on www.bakingo.com.
 *
 * Vertical rhythm is exact and must sum to the 333px card height:
 * image 250 + title (8 top margin, 20, 10 bottom) + price row 24 + rating (5 top margin, 16).
 */
export function ProductCard({ product }: { product: ProductListItem }) {
  const href = `/p/${product.categoryRouteSegment ?? "cake"}/${product.slug}`;
  const formattedRating = product.rating !== null ? product.rating.toFixed(1) : "N/A";
  const reviewsDisplay = product.review_count > 999
    ? `${(product.review_count / 1000).toFixed(1)}K`
    : product.review_count.toString();

  return (
    <Link
      href={href}
      className="group block w-[249px] shrink-0 cursor-pointer"
    >
      <article className="relative -m-1 flex min-h-[333px] w-[249px] flex-col rounded-[8px] border-4 border-transparent transition-[box-shadow,border-color] duration-300 ease-in-out group-hover:border-[#fcc4c5] group-hover:shadow-[0_0_10px_0_rgba(0,0,0,0.12)] max-[460px]:!border-transparent max-[460px]:!shadow-none">
        <div className="relative h-[250px] w-[250px] shrink-0">
          {product.is_eggless ? (
            <div className="absolute top-[14px] left-[12px] z-[1] flex h-[15px] w-[15px] items-center justify-center border border-[#00a651] bg-white p-[2px]">
              <span className="block h-[7px] w-[7px] rounded-full bg-[#00a651]" />
            </div>
          ) : null}
          <Image
            src={product.primaryImage.url}
            alt={product.primaryImage.alt ?? product.name}
            width={250}
            height={250}
            sizes="250px"
            className="h-[250px] w-[250px] rounded-[8px] bg-[#f8f9fa] object-cover transition-opacity duration-300 ease-in-out"
          />
        </div>

        <p className="mt-[8px] mb-[10px] h-[20px] w-[249px] shrink-0 overflow-hidden text-[17.28px] leading-[20px] font-semibold tracking-[-0.22px] overflow-ellipsis whitespace-nowrap text-[#070707] capitalize">
          {product.name}
        </p>

        <div className="flex h-[24px] w-[249px] shrink-0 items-center justify-between">
          <div className="flex h-[18px] items-baseline gap-[7px]">
            <span className="text-[18px] leading-[18px] font-semibold tracking-[-0.24px] text-[#070707] uppercase">
              {formatPaise(product.base_price_paise)}
            </span>
          </div>
          <span className="flex h-[24px] w-[20px] items-center justify-center transition-opacity duration-300 ease-in-out">
            <HeartIcon width={20} height={20} />
          </span>
        </div>

        <div className="mt-[5px] flex h-[16px] w-[249px] shrink-0 items-center gap-[5px]">
          <span className="flex items-center gap-[3px]">
            <span className="text-[13px] font-semibold tracking-[-0.15px] text-[#515151]">
              {formattedRating}
            </span>
            <span className="text-[13px] font-semibold tracking-[-0.15px] text-[#00a651]">
              ★
            </span>
          </span>
          <span className="text-[13px] font-semibold tracking-[-0.15px] text-[#515151]">
            ({reviewsDisplay} Reviews)
          </span>
        </div>
      </article>
    </Link>
  );
}
