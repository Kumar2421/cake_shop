"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ListingCard } from "@/components/site/ListingCard";
import { listingChips, listingSortLabel } from "@/data/listing";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/types/bakingo";

type SortMode = "default" | "price-asc" | "price-desc";

const SORT_LABEL: Record<SortMode, string> = {
  default: listingSortLabel,
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
};

/** "60 Minute Delivery" is a delivery promise, not a flavour — it filters nothing. */
const NON_FLAVOUR_CHIPS = new Set(["60 Minute Delivery"]);

const priceValue = (product: CatalogProduct) =>
  Number(product.price.replace(/[^\d]/g, "")) || 0;

export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("default");

  const visible = useMemo(() => {
    let rows = products;

    if (activeChip && !NON_FLAVOUR_CHIPS.has(activeChip)) {
      const needle = activeChip.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle),
      );
    }

    if (sort === "price-asc") {
      rows = [...rows].sort((a, b) => priceValue(a) - priceValue(b));
    } else if (sort === "price-desc") {
      rows = [...rows].sort((a, b) => priceValue(b) - priceValue(a));
    }

    return rows;
  }, [products, activeChip, sort]);

  const cycleSort = () =>
    setSort((mode) =>
      mode === "default" ? "price-asc" : mode === "price-asc" ? "price-desc" : "default",
    );

  const pill =
    "flex h-[37px] shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-[7px] border px-[16px] pt-[5px] pb-[7px] text-center text-[15px] font-medium capitalize transition-colors duration-300 md:px-[27px] md:text-[18px]";

  return (
    <>
      <div className="mb-[34px] flex h-[37px] w-full items-center justify-between">
        <div className="flex h-[37px] items-center gap-[14px] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={cycleSort}
            aria-label={`Sort products — currently ${SORT_LABEL[sort]}`}
            className={cn(
              pill,
              "gap-[10px]",
              sort === "default"
                ? "border-[#ebebeb] text-[#070707]"
                : "border-[#fc0015] bg-[#fc0015] text-white",
            )}
          >
            <span>{SORT_LABEL[sort]}</span>
            <Image
              src="/images/updownicon-cfbe7839.svg"
              alt=""
              aria-hidden
              width={21}
              height={21}
              className="h-[21px] w-[21px]"
            />
          </button>

          {listingChips.map((chip) => {
            const active = activeChip === chip.label;
            return (
              <button
                key={chip.label}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveChip(active ? null : chip.label)}
                className={cn(
                  pill,
                  active
                    ? "border-[#fc0015] bg-[#fc0015] text-white"
                    : "border-[#ebebeb] text-[#070707]",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-[64px] text-center text-[18px] text-[#515151]">
          No cakes match this filter.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-[12px] gap-y-[24px] md:grid-cols-3 md:gap-x-[20px] md:gap-y-[32px] lg:grid-cols-4 lg:gap-x-[24px] lg:gap-y-[38px]">
          {visible.map((product) => (
            <ListingCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
