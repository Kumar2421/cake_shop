import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ProductGrid } from "@/components/sections/ProductGrid";
import { ReviewStrip } from "@/components/sections/ReviewStrip";
import { QuickLinks } from "@/components/sections/QuickLinks";
import { SeoAccordion } from "@/components/sections/SeoAccordion";
import { catalog } from "@/data/catalog";
import { listingTitle, listingBreadcrumbs } from "@/data/listing";

export const metadata: Metadata = {
  title: "Best Selling Cakes Online | Order Bestseller Cakes: Bakingo",
  description:
    "Order Bakingo's best selling cakes online with free home delivery. Bestsellers from across the country, freshly baked and delivered on time.",
};

export default function BestSellerPage() {
  return (
    <>
      <SiteHeader />
      <main
        className="flex w-full flex-col pt-[56px] md:pt-[128px]"
      >
        <h1 className="mt-[25px] text-center text-[22px] leading-[28px] font-semibold text-[#070707] md:text-[30px] md:leading-[36px]">
          {listingTitle}
        </h1>

        <div className="mx-auto mt-[36px] w-full max-w-[1296px] px-[16px] md:px-[20px] lg:px-0">
          {/* Chips, sort and the grid share client state. */}
          <ProductGrid products={catalog} />

          <ReviewStrip />

          <div className="py-[16px]">
            <Breadcrumbs items={listingBreadcrumbs} />
          </div>
        </div>

        <SeoAccordion />
        <QuickLinks />
      </main>
      <SiteFooter />
    </>
  );
}
