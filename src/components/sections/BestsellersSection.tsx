import Link from "next/link";
import { getBestsellers } from "@/lib/queries/products";
import { bestsellersHeading } from "@/data/products";
import { SectionHeading } from "@/components/site/SectionHeading";
import { BestsellersSectionClient } from "@/components/sections/BestsellersSectionClient";

export async function BestsellersSection() {
  const bestsellers = await getBestsellers(10);

  return (
    <section className="w-full bg-white py-[52px] flex flex-col">
      {/* Heading */}
      <SectionHeading
        eyebrow={bestsellersHeading.eyebrow}
        subtitle={bestsellersHeading.subtitle}
        starIcon="/images/re-star.png"
      />

      <BestsellersSectionClient bestsellers={bestsellers} />

      {/* VIEW ALL link */}
      <div className="flex justify-center mt-8">
        <Link
          href="/best-seller"
          className="text-[16px] font-semibold underline"
          style={{
            color: "rgb(7, 7, 7)",
          }}
        >
          VIEW ALL
        </Link>
      </div>
    </section>
  );
}
