import Image from "next/image";
import { SectionHeading } from "@/components/site/SectionHeading";
import { promiseItems, promiseHeading } from "@/data/promise";

export function PromiseSection() {
  return (
    <section
      className="flex flex-col justify-between bg-[rgba(255,245,238,0.7)] pt-[44px] pb-[21px] lg:pt-[41px] lg:pb-[77px]"
      style={{
        backgroundImage: "url(/images/bk-half-3e395730.png)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        backgroundPosition: "0% 0%",
      }}
    >
      <SectionHeading
        eyebrow={promiseHeading.eyebrow}
        subtitle={promiseHeading.subtitle}
      />
      {/* 2×2 on phones, one row of four from 481px up. */}
      <ul className="m-0 grid list-none grid-cols-2 justify-items-center gap-[19px] p-0 min-[481px]:flex min-[481px]:flex-wrap min-[481px]:justify-center lg:gap-[42px]">
        {promiseItems.map((item, index) => {
          // Determine image dimensions based on filename
          const isOnTimeDelivery = item.image.includes("on-time-delivery");
          const imgWidth = isOnTimeDelivery ? 139 : 97;
          const imgHeight = isOnTimeDelivery ? 78 : 77;

          return (
            <li
              key={index}
              className="flex w-full flex-col items-center justify-end min-[481px]:w-[72px] lg:w-[189px]"
            >
              <Image
                src={item.image}
                alt={item.alt}
                width={imgWidth}
                height={imgHeight}
                // Tailwind preflight caps img width, so height must follow it.
                className="h-auto w-auto max-w-full"
              />
              <h5 className="text-[14px] md:text-[16px] lg:text-[20px] leading-[14px] md:leading-[16px] lg:leading-[20px] font-semibold tracking-[-0.2px] text-[#070707] text-center mt-[15px] mb-[10px]">
                {item.title}
              </h5>
              <p className="text-[12px] md:text-[13px] lg:text-[16px] leading-[15px] md:leading-[16px] lg:leading-[19.2px] font-medium tracking-[-0.16px] text-[#515151] text-center">
                {item.body}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
