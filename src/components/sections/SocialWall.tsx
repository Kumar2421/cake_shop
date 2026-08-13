import Image from "next/image";
import { socialRows, socialHeading } from "@/data/social";
import { cn } from "@/lib/utils";
import type { SocialTile } from "@/types/bakingo";

interface ProcessedTile extends SocialTile {
  badge: SocialTile | null;
}

/**
 * The extracted rows interleave photo tiles with 24×24 reel badges; a badge
 * belongs to the photo that precedes it, not to a tile of its own.
 */
function processTiles(row: SocialTile[]): ProcessedTile[] {
  const tiles: ProcessedTile[] = [];
  for (const item of row) {
    if (item.alt === "Instagram Reel") {
      const previous = tiles[tiles.length - 1];
      if (previous) previous.badge = item;
      continue;
    }
    tiles.push({ ...item, alt: "Bakingo on Instagram", badge: null });
  }
  return tiles;
}

export function SocialWall() {
  return (
    <section className="w-full bg-white py-[32px] md:py-0 md:h-[756px]">
      <div className="mb-[54px] text-center">
        <div className="flex h-[80px] items-center justify-center md:h-[132px]">
          <div className="relative mr-[15px] flex flex-col items-center">
            <h2 className="mb-[12px] text-center text-[24px] leading-[26px] font-semibold text-[#fc0015] md:text-[36px] md:leading-[36px]">
              {socialHeading.eyebrow}
            </h2>
            <p className="text-center text-[16px] leading-[20px] font-medium tracking-[-0.3px] text-[#515151] md:text-[30px] md:leading-[30px]">
              {socialHeading.subtitle}
            </p>
          </div>
          <Image
            src="/images/storyman-fc229179.svg"
            alt=""
            aria-hidden
            width={44}
            height={58}
            className="h-auto w-[32px] shrink-0 md:w-[44.44px]"
          />
        </div>

        <div className="relative flex items-center justify-center md:h-[624px]">
          <div className="flex w-full max-w-full flex-col gap-[8px] py-[10px] md:gap-[18px]">
            {socialRows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={cn(
                  "flex h-[170px] gap-[8px] px-[15px] md:h-[293px] md:gap-[12px]",
                  "overflow-x-scroll no-scrollbar",
                )}
              >
                {processTiles(row).map((tile, tileIndex) => (
                  <div
                    key={tileIndex}
                    className="relative h-[170px] w-auto shrink-0 overflow-hidden rounded-[8px] md:h-[293px]"
                  >
                    <Image
                      src={tile.image}
                      alt={tile.alt}
                      width={tile.width}
                      height={tile.height}
                      className="h-full w-auto max-w-none object-cover"
                    />
                    {tile.badge ? (
                      <Image
                        src={tile.badge.image}
                        alt="Instagram Reel"
                        width={24}
                        height={24}
                        className="absolute top-[8px] right-[8px] h-[24px] w-[24px]"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
