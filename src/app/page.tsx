import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { HeroCarousel } from "@/components/sections/HeroCarousel";
import { CategoryRail } from "@/components/sections/CategoryRail";
import { BestsellersSection } from "@/components/sections/BestsellersSection";
import { PromiseSection } from "@/components/sections/PromiseSection";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { SocialWall } from "@/components/sections/SocialWall";
import { SeoAccordion } from "@/components/sections/SeoAccordion";

/**
 * Homepage clone of https://www.bakingo.com/.
 *
 * Section order and offsets come from docs/research/www.bakingo.com/PAGE_TOPOLOGY.md:
 * the header is fixed at z-99, so the flow content starts one header-height down.
 */
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main
        className="flex w-full flex-col pt-[56px] md:pt-[128px]"
      >
        <HeroCarousel />
        <CategoryRail />
        <BestsellersSection />
        <PromiseSection />
        <CtaBanner />
        <SocialWall />
        <SeoAccordion />
      </main>
      <SiteFooter />
    </>
  );
}
