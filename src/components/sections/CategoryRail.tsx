import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/site/SectionHeading";
import { categoryTiles } from "@/data/categories";
import { categoryHeading } from "@/data/categoriesHeading";

/**
 * `.content_4` on www.bakingo.com — the "menu / What will you wish for?" tile rail.
 *
 * One markup block for every viewport: a 2-column grid on phones, 3 columns from
 * 481px, and the horizontal scroll rail (227px fixed tiles) from 769px.
 */
export function CategoryRail() {
  return (
    <section className="flex w-full flex-col justify-center bg-[#ffe8ee] py-[52px] md:h-[586px]">
      <SectionHeading
        eyebrow={categoryHeading.eyebrow}
        subtitle={categoryHeading.subtitle}
      />

      <div className="grid grid-cols-2 gap-[18px] px-[16px] pt-[32px] min-[481px]:grid-cols-3 min-[481px]:gap-[24px] min-[481px]:px-[32px] md:flex md:gap-[29px] md:overflow-x-auto md:px-[65px] md:pt-[53px] md:no-scrollbar">
        {categoryTiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="flex flex-col items-center gap-[18px] md:h-[341px] md:w-[227px] md:shrink-0"
          >
            <div className="aspect-[227/286] w-full md:h-[286px] md:w-[227px]">
              <Image
                src={tile.image}
                alt={tile.alt}
                width={227}
                height={286}
                sizes="(max-width: 768px) 45vw, 227px"
                className="h-full w-full rounded-[12px] object-cover"
              />
            </div>
            <span className="text-center text-[16px] font-semibold text-[#070707] uppercase md:h-[31px] md:text-[22px]">
              {tile.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
