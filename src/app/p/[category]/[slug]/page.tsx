import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ProductGallery } from "@/components/sections/ProductGallery";
import { ProductPurchasePanel } from "@/components/sections/ProductPurchasePanel";
import { ProductReviews } from "@/components/sections/ProductReviews";
import { RelatedRail } from "@/components/sections/RelatedRail";
import { QuickLinks } from "@/components/sections/QuickLinks";
import { catalog, getProduct, getRelated } from "@/data/catalog";

interface RouteParams {
  params: Promise<{ category: string; slug: string }>;
}

/** Every catalog SKU is prerendered — 50 pages, all from real extracted data. */
export function generateStaticParams() {
  return catalog.map((product) => ({
    category: product.category,
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product not found | Bakingo" };

  return {
    title: `${product.name} | Bakingo`,
    description: product.description,
    openGraph: {
      title: `${product.name} | Bakingo`,
      description: product.description,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: RouteParams) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = getRelated(slug);

  return (
    <>
      <SiteHeader />
      <main
        className="flex w-full flex-col pt-[56px] md:pt-[128px]"
      >
        <div className="mx-auto w-full max-w-[1296px] px-[16px] md:px-[20px] lg:px-0">
          <div className="py-[14px]">
            <Breadcrumbs items={product.breadcrumbs} />
          </div>

          <div className="flex flex-col gap-[24px] lg:flex-row lg:gap-0">
            {/* The gallery pins while the purchase panel scrolls. */}
            <div className="lg:sticky lg:top-[96px] lg:h-fit lg:w-[674px] lg:shrink-0">
              <ProductGallery product={product} />
            </div>

            <div className="w-full lg:w-[622px]">
              <ProductPurchasePanel product={product} />
              <ProductReviews product={product} />
            </div>
          </div>
        </div>

        <hr className="mt-[40px] w-full border-t border-[#ebebeb]" />

        <RelatedRail products={related} />

        <QuickLinks />
      </main>
      <SiteFooter />
    </>
  );
}
