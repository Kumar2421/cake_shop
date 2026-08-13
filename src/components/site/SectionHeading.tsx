import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SectionHeading as SectionHeadingContent } from "@/types/bakingo";

interface SectionHeadingProps extends SectionHeadingContent {
  /** Decorative star pinned to the top-left of the eyebrow (India Loves only). */
  starIcon?: string;
  className?: string;
}

/**
 * `.heading-section` on www.bakingo.com — shared by the category rail, India Loves
 * and Our Promise. Exact computed values:
 *   wrapper  flex column, items-center, gap 12px, height 88px
 *   eyebrow  42px/46px, weight 600, tracking -0.42px, #fc0015, capitalize
 *   subtitle 30px/30px, weight 500, tracking -0.3px, #515151
 */
export function SectionHeading({
  eyebrow,
  subtitle,
  starIcon,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-3 md:h-[88px]",
        className,
      )}
    >
      <div className="relative text-center text-[28px] leading-[32px] font-semibold capitalize tracking-[-0.42px] text-[#fc0015] md:text-[42px] md:leading-[46px]">
        {starIcon ? (
          <Image
            src={starIcon}
            alt=""
            width={56}
            height={54}
            aria-hidden
            className="absolute -top-[15px] -left-[41px] h-[54px] w-[56px]"
          />
        ) : null}
        <span className="relative">{eyebrow}</span>
      </div>
      <div className="relative text-center text-[18px] leading-[22px] font-medium tracking-[-0.3px] text-[#515151] md:text-[30px] md:leading-[30px]">
        {subtitle}
      </div>
    </div>
  );
}
