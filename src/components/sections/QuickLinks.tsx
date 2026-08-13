import Link from "next/link";
import { quickLinksHeading, quickLinkGroups } from "@/data/listing";

/**
 * `.quick_links` SEO link block on the listing page.
 * Displays 8 groups of categorized links with uppercase headings.
 * Container: 1296px wide, centred, height 682px at 1440px.
 */
export function QuickLinks() {
  return (
    <section className="quick_links mx-auto w-[1296px] px-0">
      <h2 className="mb-[40px] text-center text-[30px] font-semibold text-[#070707]">
        {quickLinksHeading}
      </h2>

      <div className="flex flex-col gap-[40px]">
        {quickLinkGroups.map((group, index) => (
          <div key={index}>
            <h3 className="mb-[16px] text-[14px] font-bold uppercase text-[#070707]">
              {group.heading}
            </h3>
            <div className="flex flex-wrap gap-0 text-[13px] text-[#515151]">
              {group.links.map((link, linkIndex) => (
                <div key={linkIndex} className="flex items-center gap-0">
                  {link.href ? (
                    <Link
                      href={link.href}
                      className="hover:underline"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <span>{link.label}</span>
                  )}
                  {linkIndex < group.links.length - 1 && (
                    <span className="mx-[8px] text-[#d9d9d9]">|</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
