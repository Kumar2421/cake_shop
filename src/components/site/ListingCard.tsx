import Image from "next/image";
import Link from "next/link";
import { HeartIcon } from "@/components/icons";
import type { CatalogProduct } from "@/types/bakingo";

/**
 * `.product-card.listing_product` on www.bakingo.com.
 * 306px wide variant of ProductCard for the listing page.
 *
 * Vertical rhythm (390.281px total):
 * image 306 + title (8 top margin, 17.28, 0 bottom) + price row (12 top margin, 24) + rating (16).
 */
export function ListingCard({ product }: { product: CatalogProduct }) {
  return (
    <Link
      href={product.href}
      className="group block w-[306px] shrink-0 cursor-pointer"
    >
      <article className="relative -m-1 flex min-h-[390.281px] w-[306px] flex-col rounded-[8px] border-4 border-transparent transition-[box-shadow,border-color] duration-300 ease-in-out group-hover:border-[#fcc4c5] group-hover:shadow-[0_0_10px_0_rgba(0,0,0,0.12)] max-[460px]:!border-transparent max-[460px]:!shadow-none">
        <div className="relative h-[306px] w-[306px] shrink-0">
          {product.eggless ? (
            <div className="absolute top-[14px] left-[14px] z-[1] flex h-[17.27px] w-[17.27px] items-center justify-center bg-white p-[2px]">
              <span className="block h-[9.27px] w-[9.27px] rounded-[10px] bg-[#00a651]" />
            </div>
          ) : null}

          {product.tag ? (
            <div className="absolute top-[284px] left-0 z-[2] flex h-[22px] items-center bg-[#f6b308] px-[9px] rounded-[0_7px_0_7px]">
              <span className="text-[12.96px] leading-[19.44px] font-semibold tracking-[-0.12px] text-[#070707]">
                {product.tag}
              </span>
            </div>
          ) : null}

          <Image
            src={product.image}
            alt={product.alt}
            width={306}
            height={306}
            sizes="306px"
            className="h-[306px] w-[306px] rounded-[7px] bg-[#f8f9fa] object-cover transition-opacity duration-300 ease-in-out"
          />
        </div>

        <p className="mt-[8px] h-[17.28px] w-[306px] shrink-0 overflow-hidden text-[17.28px] leading-[17.28px] font-semibold tracking-[-0.22px] overflow-ellipsis whitespace-nowrap text-[#070707] capitalize">
          {product.name}
        </p>

        <div className="mt-[12px] flex h-[24px] w-[306px] shrink-0 items-center justify-between">
          <div className="flex h-[18px] items-baseline gap-[7px]">
            <span className="text-[18px] leading-[18px] font-semibold tracking-[-0.24px] text-[#070707] uppercase">
              {product.price}
            </span>
          </div>
          <span className="flex h-[24px] w-[20px] items-center justify-center transition-opacity duration-300 ease-in-out">
            <HeartIcon width={20} height={20} />
          </span>
        </div>

        <div className="mt-[5px] flex h-[16px] w-[306px] shrink-0 items-center gap-[5px]">
          <span className="flex items-center gap-[3px]">
            <span className="text-[13px] font-semibold tracking-[-0.15px] text-[#515151]">
              {product.rating}
            </span>
            <span className="text-[13px] font-semibold tracking-[-0.15px] text-[#00a651]">
              ★
            </span>
          </span>
          <span className="text-[13px] font-semibold tracking-[-0.15px] text-[#515151]">
            ({product.reviews} Reviews)
          </span>
        </div>
      </article>
    </Link>
  );
}
