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
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/products";
import { createStaticClient } from "@/lib/supabase/static";

interface RouteParams {
  params: Promise<{ category: string; slug: string }>;
}

/** Generate static params from database product slugs. */
export async function generateStaticParams() {
  // Must not use the cookie-backed server client: generateStaticParams runs at
  // build time with no HTTP request, and reading cookies there throws.
  const db = createStaticClient();

  const { data, error } = await db
    .from("products")
    .select("slug, categories(route_segment)")
    .eq("is_active", true);

  // A failed lookup should not fail the build; those routes still render
  // on demand and are cached by the revalidate window below.
  if (error || !data) return [];

  return data.map((product) => ({
    category: product.categories?.route_segment ?? "cake",
    slug: product.slug,
  }));
}

export const revalidate = 3600; // Revalidate every hour so new products appear

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product not found | Bakingo" };
  }

  const primaryImage = product.product_images[0]?.url || "";

  return {
    title: `${product.name} | Bakingo`,
    description: product.description || "",
    openGraph: {
      title: `${product.name} | Bakingo`,
      description: product.description || "",
      images: primaryImage ? [primaryImage] : [],
    },
  };
}

export default async function ProductPage({ params }: RouteParams) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product.id, product.category_id);

  // Construct breadcrumbs dynamically
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: product.categories?.name || "Products", href: null },
  ];

  return (
    <>
      <SiteHeader />
      <main
        className="flex w-full flex-col pt-[56px] md:pt-[128px]"
      >
        <div className="mx-auto w-full max-w-[1296px] px-[16px] md:px-[20px] lg:px-0">
          <div className="py-[14px]">
            <Breadcrumbs items={breadcrumbs} />
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
