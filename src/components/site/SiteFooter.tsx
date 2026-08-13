import { footerColumns, footerSocials, footerMeta } from "@/data/footer";
import {
  BakingoWordmark,
  SubscribeArrowIcon,
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedInIcon,
  YoutubeIcon,
} from "@/components/icons";

/** Each brand mark keeps its own intrinsic size on the target — do not normalise. */
const SOCIALS = {
  facebook: { Icon: FacebookIcon, width: 13, height: 25, label: "Facebook" },
  instagram: { Icon: InstagramIcon, width: 23, height: 23, label: "Instagram" },
  twitter: { Icon: TwitterIcon, width: 23, height: 22, label: "X" },
  linkedIn: { Icon: LinkedInIcon, width: 22, height: 22, label: "LinkedIn" },
  youtube: { Icon: YoutubeIcon, width: 24, height: 17, label: "YouTube" },
} as const;

type SocialName = keyof typeof SOCIALS;

export function SiteFooter() {
  return (
    <footer
      className="flex w-full bg-[#fff5ee] bg-cover bg-no-repeat"
      style={{ backgroundImage: "url(/images/footer-background-0f80c8bb.svg)" }}
    >
      <div className="flex w-full flex-col gap-[32px] px-[16px] pt-[32px] pb-[32px] md:gap-[50px] md:px-[32px] md:pt-[50px] lg:mx-[46px] lg:pt-[75px] lg:pr-[118px] lg:pl-[62px]">
        <div className="flex flex-col items-stretch gap-[16px] md:flex-row md:items-center md:justify-between md:gap-[20px]">
          <div className="text-[18px] leading-[20px] font-semibold text-[#fc0015] uppercase md:text-[22px] md:leading-[24px] lg:text-[28px] lg:leading-[28px]">
            {footerMeta.newsletterHeading}
          </div>

          <div className="flex flex-col gap-[4px] md:w-[551px] md:shrink-0">
            <form className="flex h-[51px] w-full items-center gap-[15px] rounded-[8px] bg-white py-[13px] pr-[14px] pl-[23px]">
              <input
                type="email"
                className="min-w-0 flex-1 border-0 bg-transparent text-[16px] leading-[20px] font-semibold text-[#070707] outline-none"
                placeholder={footerMeta.inputPlaceholder}
              />
              <button
                type="button"
                className="shrink-0 cursor-pointer"
                aria-label="Subscribe"
              >
                <SubscribeArrowIcon width={29} height={13} />
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-[32px] md:flex-row md:justify-between md:gap-0">
          {/* Wordmark, copyright and socials — first on desktop, last on mobile. */}
          <div className="order-2 flex w-full flex-col md:order-1 md:w-[245px]">
            <BakingoWordmark width={202} height={60} />
            <div className="mt-[17px] text-[16px] leading-[17.76px] font-medium text-[#fc0015] uppercase">
              {footerMeta.copyright}
            </div>
            <div className="mt-[15px] flex items-center gap-[18px]">
              {footerSocials.map((social) => {
                const entry = SOCIALS[social.name as SocialName];
                if (!entry) return null;
                const { Icon, width, height, label } = entry;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center"
                    aria-label={label}
                  >
                    <Icon width={width} height={height} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns — stacked on mobile, three across from 768px. */}
          <div className="order-1 flex flex-col gap-[24px] md:order-2 md:flex-row md:gap-[32px] lg:gap-[75px]">
            {footerColumns.map((column) => (
              <div key={column.heading} className="flex flex-col gap-[7px]">
                <div className="text-[16px] leading-[18px] font-bold text-[#fc0015] uppercase md:text-[18px] md:leading-[20px] lg:text-[22px] lg:leading-[22px]">
                  {column.heading}
                </div>
                <div className="flex flex-col">
                  {column.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href ?? "#"}
                      className="text-[15px] leading-[28px] font-medium text-[#fc0015] capitalize md:text-[16px] lg:text-[20px] lg:leading-[33.2px]"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
